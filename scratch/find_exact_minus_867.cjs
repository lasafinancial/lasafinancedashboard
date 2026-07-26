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

async function test() {
  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const tabs = ['current', 'lasa-master'];

  for (const t of tabs) {
    console.log(`\n======================================================`);
    console.log(`Searching tab '${t}' for MAPMYINDIA values`);
    console.log(`======================================================`);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: EOD_SHEET_ID,
      range: `'${t}'!A1:ZZ`,
    });
    const rows = res.data.values || [];
    if (rows.length === 0) continue;
    const headers = rows[0].map(h => (h || '').toString().trim());

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const str = row.join(' | ').toUpperCase();
      if (str.includes('MAPMYINDIA') || str.includes('CEINFO')) {
        console.log(`\nRow ${r + 1} in '${t}':`);
        for (let c = 0; c < row.length; c++) {
          const val = (row[c] || '').toString().trim();
          if (val && val !== '0' && val !== 'N/A') {
            const colName = idxToCol(c);
            const header = headers[c] || `Col_${colName}`;
            if (val.includes('8.67') || val.includes('8.6') || val.includes('FK') || c === 166 || c === 40 || c === 4 || c === 2) {
              console.log(`  Col ${colName} (idx ${c}) [Header: "${header}"]: "${val}"`);
            }
          }
        }
      }
    }
  }
}

test().catch(console.error);
