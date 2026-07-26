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
  const allstocksData = res.data.values || [];
  console.log(`lasa-master total rows: ${allstocksData.length}`);

  if (allstocksData.length > 1) {
    const headers = allstocksData[0].map(h => (h || '').toString().trim().toUpperCase());
    console.log('Headers count:', headers.length);

    let obvIdx = headers.indexOf('OBV_SIGNAL');
    if (obvIdx === -1) obvIdx = headers.indexOf('OBV SIGNAL');
    if (obvIdx === -1) obvIdx = headers.indexOf('OBV');
    if (obvIdx === -1) obvIdx = colToIdx('FO');

    let frIdx = headers.indexOf('FR');
    if (frIdx === -1) frIdx = headers.indexOf('OBV_DAILY');
    if (frIdx === -1) frIdx = headers.indexOf('OBV BREAKOUT');
    if (frIdx === -1) frIdx = colToIdx('FR');

    console.log(`obvIdx: ${obvIdx}, frIdx: ${frIdx}`);

    const currentObvSignalMap = new Map();
    const currentFrMap = new Map();

    for (let i = 1; i < allstocksData.length; i++) {
      const rawRow = allstocksData[i];
      if (!rawRow || rawRow.length === 0) continue;

      const sym = (rawRow[colToIdx('C')] || rawRow[colToIdx('A')] || '').toString().trim().toUpperCase();
      if (sym) {
        const obvSignal = obvIdx !== -1 && obvIdx < rawRow.length ? (rawRow[obvIdx] || '').toString().trim() : '';
        const frValue = frIdx !== -1 && frIdx < rawRow.length ? (rawRow[frIdx] || '').toString().trim() : '';
        if (obvSignal) currentObvSignalMap.set(sym, obvSignal);
        if (frValue) currentFrMap.set(sym, frValue);
      }
    }

    console.log(`Extracted currentObvSignalMap size: ${currentObvSignalMap.size}`);
    console.log(`Extracted currentFrMap size: ${currentFrMap.size}`);
  }
}

test().catch(console.error);
