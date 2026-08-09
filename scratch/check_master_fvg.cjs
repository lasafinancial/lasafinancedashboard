const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

function colToIdx(col) {
  let idx = 0;
  for (let i = 0; i < col.length; i++) {
    idx = idx * 26 + (col.toUpperCase().charCodeAt(i) - 64);
  }
  return idx - 1;
}

function idxToCol(idx) {
  let col = '';
  let temp = idx + 1;
  while (temp > 0) {
    let rem = (temp - 1) % 26;
    col = String.fromCharCode(65 + rem) + col;
    temp = Math.floor((temp - 1) / 26);
  }
  return col;
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
    spreadsheetId: EOD_SHEET_ID,
    range: "'lasa-master'!A1:ZZ1"
  });

  const headers = (res.data.values || [])[0].map(h => (h || '').toString().trim());
  console.log(`lasa-master total headers: ${headers.length}`);

  headers.forEach((h, idx) => {
    if (h.toUpperCase().includes('FVG') || h.toUpperCase().includes('BAL') || h.toUpperCase().includes('PROJ')) {
      console.log(`Header at idx ${idx} (Col ${idxToCol(idx)}): "${h}"`);
    }
  });

  // Check last 20 rows of lasa-master for DJ (idx 113) or PROJ_FVG
  const djIdx = colToIdx('DJ');
  console.log(`\nCol DJ (idx ${djIdx}) header: "${headers[djIdx]}"`);

  const dataRes = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: "'lasa-master'!A2:ZZ100"
  });

  const dataRows = dataRes.data.values || [];
  let nonZeroCount = 0;
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const val = row[djIdx];
    if (val && parseFloat(val) > 0) {
      nonZeroCount++;
      if (nonZeroCount <= 5) {
        console.log(`  Row ${i+2} [${row[colToIdx('C')] || row[0]}]: Col DJ = "${val}"`);
      }
    }
  }

  console.log(`Non-zero Col DJ values in first 100 rows: ${nonZeroCount}`);
}

main().catch(console.error);
