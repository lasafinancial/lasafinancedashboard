const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

function getCredentials() {
  const keyPath = path.join(__dirname, '..', 'secerate_googlekey', 'key-partition-484615-n5-3411b9e54bd0.json');
  if (fs.existsSync(keyPath)) {
    return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  }
  throw new Error('No key file found');
}

function colToIdx(colStr) {
  let result = 0;
  for (let i = 0; i < colStr.length; i++) {
    result = result * 26 + (colStr.charCodeAt(i) - 64);
  }
  return result - 1;
}

async function test() {
  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: "'lasa-master'!A1:ZZ",
  });
  const rows = res.data.values || [];
  const headers = rows[0].map(h => (h || '').toString().trim().toUpperCase());

  let obvIdx = headers.indexOf('OBV_SIGNAL');
  if (obvIdx === -1) obvIdx = headers.indexOf('OBV SIGNAL');
  if (obvIdx === -1) obvIdx = headers.indexOf('OBV');
  if (obvIdx === -1) obvIdx = colToIdx('FO');

  let frIdx = headers.indexOf('FR');
  if (frIdx === -1) frIdx = headers.indexOf('OBV_DAILY');
  if (frIdx === -1) frIdx = colToIdx('FR');

  let dateIdx = headers.indexOf('DATE');
  if (dateIdx === -1) dateIdx = colToIdx('B');

  // Let's find latest date in lasa-master
  const dates = new Set();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][dateIdx]) dates.add(rows[i][dateIdx]);
  }
  const sortedDates = Array.from(dates).sort();
  const latestDate = sortedDates[sortedDates.length - 1];
  console.log(`Latest date in lasa-master: ${latestDate}`);

  // Inspect stocks on latest date
  const latestRows = rows.filter(r => r[dateIdx] === latestDate);
  console.log(`Total rows on latest date (${latestDate}): ${latestRows.length}`);

  const obvMap = new Map();
  const frMap = new Map();
  let accYesCount = 0;

  for (const r of latestRows) {
    const sym = (r[colToIdx('C')] || r[colToIdx('A')] || '').toString().trim().toUpperCase();
    const obv = obvIdx < r.length ? (r[obvIdx] || '').toString().trim() : '';
    const fr = frIdx < r.length ? (r[frIdx] || '').toString().trim() : '';

    if (sym) {
      if (obv) obvMap.set(sym, obv);
      if (fr) frMap.set(sym, fr);

      if (fr.toUpperCase() === 'YES' && (obv.toUpperCase() === 'ACCUMULATION' || obv.toUpperCase() === 'BULLISH')) {
        accYesCount++;
      }
    }
  }

  console.log(`On latest date (${latestDate}):`);
  console.log(`  Unique stocks with obvSignal: ${obvMap.size}`);
  console.log(`  Unique stocks with fr: ${frMap.size}`);
  console.log(`  Stocks with fr === 'YES' && obvSignal === 'ACCUMULATION': ${accYesCount}`);
}

test().catch(console.error);
