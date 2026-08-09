const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const ALLSTOCKS_SHEET_ID = '1uibGhhv6Zdil2aWk17fcq1U-csYUffBdQv3Relrgfog';

function colToIdx(col) {
  let idx = 0;
  for (let i = 0; i < col.length; i++) {
    idx = idx * 26 + (col.toUpperCase().charCodeAt(i) - 64);
  }
  return idx - 1;
}

function getCredentials() {
  const keyPath = path.join(__dirname, '..', 'secerate_googlekey', 'key-partition-484615-n5-3411b9e54bd0.json');
  if (fs.existsSync(keyPath)) {
    return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  }
  const files = fs.readdirSync(path.join(__dirname, '..')).filter(f => f.endsWith('.json') && f.includes('key'));
  if (files.length > 0) {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '..', files[0]), 'utf8'));
  }
  throw new Error('Key file not found');
}

async function main() {
  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: ALLSTOCKS_SHEET_ID,
    range: "'allstocks'!A1:ZZ"
  });

  const rows = res.data.values || [];
  console.log(`Total rows: ${rows.length}`);

  const headers = rows[0].map(h => (h || '').toString().trim().toUpperCase());
  let idIdx = headers.indexOf('SYMBOL');
  if (idIdx === -1) idIdx = headers.indexOf('ID');
  if (idIdx === -1) idIdx = colToIdx('C');

  let obvIdx = headers.indexOf('OBV_SIGNAL');
  if (obvIdx === -1) obvIdx = headers.indexOf('OBV SIGNAL');
  if (obvIdx === -1) obvIdx = colToIdx('FO');

  let frIdx = headers.indexOf('OBV_DAILY_BREAKOUT');
  if (frIdx === -1) frIdx = headers.indexOf('FR');
  if (frIdx === -1) frIdx = headers.indexOf('OBV_DAILY');
  if (frIdx === -1) frIdx = colToIdx('FR');

  console.log(`idIdx=${idIdx}, obvIdx=${obvIdx}, frIdx=${frIdx}`);

  const matchingStocks = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const sym = (r[idIdx] || r[colToIdx('C')] || r[0] || '').toString().trim();
    const obvSignal = (r[obvIdx] !== undefined ? r[obvIdx] : (r[colToIdx('FO')] || '')).toString().trim();
    const fr = (r[frIdx] !== undefined ? r[frIdx] : (r[colToIdx('FR')] || '')).toString().trim();

    const isYes = fr.toUpperCase() === 'YES';
    const isAcc = obvSignal.toUpperCase() === 'ACCUMULATION' || obvSignal.toUpperCase() === 'BULLISH';

    if (isYes && isAcc) {
      matchingStocks.push({ sym, obvSignal, fr });
    }
  }

  console.log(`\nFound ${matchingStocks.length} stocks satisfying OBV Accumulation scan criteria (YES + ACCUMULATION/BULLISH):`);
  console.table(matchingStocks);
}

main().catch(console.error);
