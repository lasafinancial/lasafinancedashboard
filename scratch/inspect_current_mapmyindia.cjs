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

  const colFK = colToIdx('FK');
  const colAO = colToIdx('AO');
  const colC = colToIdx('C');
  const colA = colToIdx('A');
  const colE = colToIdx('E');

  console.log(`\n=== Checking 'current' tab ===`);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: `'current'!A1:ZZ`,
  });
  const rows = res.data.values || [];
  console.log(`Total rows in current: ${rows.length}`);
  
  const headers = rows[0].map(h => (h || '').toString().trim().toUpperCase());
  console.log(`Header at FK (${colFK}): "${headers[colFK]}"`);
  console.log(`Header at AO (${colAO}): "${headers[colAO]}"`);

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const str = row.join(' | ').toUpperCase();
    if (str.includes('MAPMYINDIA') || str.includes('CEINFO')) {
      console.log(`Row ${r + 1}:`);
      console.log(`  Col A: ${row[colA]}`);
      console.log(`  Col C (Symbol): ${row[colC]}`);
      console.log(`  Col E (Close): ${row[colE]}`);
      console.log(`  Col AO (Model Price): ${row[colAO]}`);
      console.log(`  Col FK (Model %): ${row[colFK]}`);
    }
  }
}

test().catch(console.error);
