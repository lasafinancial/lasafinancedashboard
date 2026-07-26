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

  const fkIdx = colToIdx('FK');
  console.log(`fkIdx = ${fkIdx}`);

  for (let i = 1; i < allstocksData.length; i++) {
    const rawRow = allstocksData[i];
    const str = (rawRow || []).join(' | ').toUpperCase();
    if (str.includes('MAPMYINDIA')) {
      const colC = (rawRow[colToIdx('C')] || '').toString().trim();
      const colFKVal = rawRow[fkIdx];
      const rowLen = rawRow ? rawRow.length : 0;
      console.log(`Row ${i + 1}: length = ${rowLen} | Col C = "${colC}" | Col FK (index ${fkIdx}) = "${colFKVal}"`);
    }
  }
}

test().catch(console.error);
