const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Let's test server.cjs endpoint or import server logic
async function test() {
  const keyPath = path.join(__dirname, '..', 'secerate_googlekey', 'key-partition-484615-n5-3411b9e54bd0.json');
  const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

  // Fetch lasa-master tab
  const masterRes = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: "'lasa-master'!A1:ZZ",
  });
  const rows = masterRes.data.values || [];
  const headers = rows[0].map(h => (h || '').toString().trim().toUpperCase());

  function colToIdx(colStr) {
    let result = 0;
    for (let i = 0; i < colStr.length; i++) {
      result = result * 26 + (colStr.charCodeAt(i) - 64);
    }
    return result - 1;
  }

  let obvIdx = headers.indexOf('OBV_SIGNAL');
  if (obvIdx === -1) obvIdx = headers.indexOf('OBV SIGNAL');
  if (obvIdx === -1) obvIdx = headers.indexOf('OBV');
  if (obvIdx === -1) obvIdx = colToIdx('FO');

  let frIdx = headers.indexOf('FR');
  if (frIdx === -1) frIdx = headers.indexOf('OBV_DAILY');
  if (frIdx === -1) frIdx = colToIdx('FR');

  let obvSignalCount = 0;
  let frCount = 0;
  let bothMatchCount = 0;

  const matches = [];

  for (let i = 1; i < rows.length; i++) {
    const rawRow = rows[i];
    if (!rawRow || rawRow.length === 0) continue;
    const sym = (rawRow[colToIdx('C')] || rawRow[colToIdx('A')] || '').toString().trim().toUpperCase();
    const obvSignal = obvIdx < rawRow.length ? (rawRow[obvIdx] || '').toString().trim() : '';
    const fr = frIdx < rawRow.length ? (rawRow[frIdx] || '').toString().trim() : '';

    const isYes = fr.toUpperCase() === 'YES';
    const isAcc = obvSignal.toUpperCase() === 'ACCUMULATION' || obvSignal.toUpperCase() === 'BULLISH';

    if (obvSignal) obvSignalCount++;
    if (fr) frCount++;
    if (isYes && isAcc) {
      bothMatchCount++;
      matches.push({ sym, obvSignal, fr });
    }
  }

  console.log(`lasa-master Total Rows evaluated: ${rows.length - 1}`);
  console.log(`Stocks with OBV Signal: ${obvSignalCount}`);
  console.log(`Stocks with FR: ${frCount}`);
  console.log(`Stocks matching both isYes ('YES') and isAcc ('ACCUMULATION' / 'BULLISH'): ${bothMatchCount}`);
  console.log('Sample matching stocks:');
  console.log(matches.slice(0, 15));
}

test().catch(console.error);
