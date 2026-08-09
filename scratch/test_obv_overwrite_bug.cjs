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

  let dateIdx = headers.indexOf('DATE');
  if (dateIdx === -1) dateIdx = colToIdx('B');

  let obvIdx = headers.indexOf('OBV_SIGNAL');
  if (obvIdx === -1) obvIdx = headers.indexOf('OBV SIGNAL');
  if (obvIdx === -1) obvIdx = headers.indexOf('OBV');
  if (obvIdx === -1) obvIdx = colToIdx('FO');

  let frIdx = headers.indexOf('FR');
  if (frIdx === -1) frIdx = headers.indexOf('OBV_DAILY');
  if (frIdx === -1) frIdx = colToIdx('FR');

  // Let's test naive loop (overwriting every row):
  const naiveObvMap = new Map();
  const naiveFrMap = new Map();

  for (let i = 1; i < rows.length; i++) {
    const rawRow = rows[i];
    if (!rawRow || rawRow.length === 0) continue;
    const sym = (rawRow[colToIdx('C')] || rawRow[colToIdx('A')] || '').toString().trim().toUpperCase();
    const obvSignal = obvIdx < rawRow.length ? (rawRow[obvIdx] || '').toString().trim() : '';
    const fr = frIdx < rawRow.length ? (rawRow[frIdx] || '').toString().trim() : '';
    if (sym) {
      if (obvSignal) naiveObvMap.set(sym, obvSignal);
      if (fr) naiveFrMap.set(sym, fr);
    }
  }

  let naiveAccYesCount = 0;
  for (const [sym, obv] of naiveObvMap.entries()) {
    const fr = naiveFrMap.get(sym) || '';
    if (fr.toUpperCase() === 'YES' && (obv.toUpperCase() === 'ACCUMULATION' || obv.toUpperCase() === 'BULLISH')) {
      naiveAccYesCount++;
    }
  }
  console.log(`Naive loop (overwriting all historical rows) match count: ${naiveAccYesCount}`);

  // Now let's test ONLY checking rows for the LATEST DATE in lasa-master:
  const dates = new Set();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][dateIdx]) dates.add(rows[i][dateIdx]);
  }
  const sortedDates = Array.from(dates).sort();
  const latestDate = sortedDates[sortedDates.length - 1];
  console.log(`Latest date in lasa-master: ${latestDate}`);

  const latestObvMap = new Map();
  const latestFrMap = new Map();
  let latestAccYesCount = 0;

  for (let i = 1; i < rows.length; i++) {
    const rawRow = rows[i];
    if (!rawRow || rawRow.length === 0) continue;
    if (rawRow[dateIdx] !== latestDate) continue;

    const sym = (rawRow[colToIdx('C')] || rawRow[colToIdx('A')] || '').toString().trim().toUpperCase();
    const obvSignal = obvIdx < rawRow.length ? (rawRow[obvIdx] || '').toString().trim() : '';
    const fr = frIdx < rawRow.length ? (rawRow[frIdx] || '').toString().trim() : '';
    if (sym) {
      if (obvSignal) latestObvMap.set(sym, obvSignal);
      if (fr) latestFrMap.set(sym, fr);

      if (fr.toUpperCase() === 'YES' && (obvSignal.toUpperCase() === 'ACCUMULATION' || obvSignal.toUpperCase() === 'BULLISH')) {
        latestAccYesCount++;
      }
    }
  }
  console.log(`Latest date ONLY (${latestDate}) match count: ${latestAccYesCount}`);
}

test().catch(console.error);
