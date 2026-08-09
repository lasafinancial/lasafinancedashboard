const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';
const ALLSTOCKS_SHEET_ID = '1uibGhhv6Zdil2aWk17fcq1U-csYUffBdQv3Relrgfog';

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

async function checkSheetBalance(sheets, spreadsheetId, tabName) {
  console.log(`\n--- Checking "${tabName}" in ${spreadsheetId} ---`);
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${tabName}'!A1:ZZ`
    });
    const rows = res.data.values || [];
    if (rows.length === 0) {
      console.log('No rows');
      return;
    }
    const headers = rows[0].map(h => (h || '').toString().trim().toUpperCase());
    console.log(`Total headers: ${headers.length}`);

    headers.forEach((h, idx) => {
      if (h.includes('BAL') || h.includes('FVG') || h.includes('PROJ')) {
        console.log(`  idx ${idx} (Col ${idxToCol(idx)}): "${h}"`);
        // sample values
        for (let i = 1; i <= Math.min(5, rows.length - 1); i++) {
          const val = rows[i][idx];
          console.log(`    Row ${i} [${rows[i][colToIdx('C')] || rows[i][0]}]: "${val}"`);
        }
      }
    });
  } catch (e) {
    console.error(`Error on ${tabName}:`, e.message);
  }
}

async function main() {
  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  await checkSheetBalance(sheets, ALLSTOCKS_SHEET_ID, 'allstocks');
  await checkSheetBalance(sheets, EOD_SHEET_ID, 'lasa-master');
  await checkSheetBalance(sheets, EOD_SHEET_ID, 'current');
  await checkSheetBalance(sheets, EOD_SHEET_ID, 'intraday-breakout-scanner');
}

main().catch(console.error);
