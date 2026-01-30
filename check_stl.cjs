const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

function getCredentials() {
  const keyPath = path.join(__dirname, 'secerate_googlekey', 'key-partition-484615-n5-52acc9edc675.json');
  return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
}

async function main() {
  const auth = new google.auth.GoogleAuth({
    credentials: getCredentials(),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: 'lasa-master!A:FJ',
  });
  const rows = res.data.values;
  const headers = rows[0];
  const stockNameIdx = headers.indexOf('STOCK_NAME');
  const dateIdx = headers.indexOf('DATE');
  
  const stlRows = rows.filter(r => r[stockNameIdx] === 'STL Global Limited');
  console.log('Total STL rows:', stlRows.length);
  stlRows.slice(-10).forEach(r => {
    console.log(r[dateIdx], r[headers.indexOf('CLOSE_PRICE')], r[headers.indexOf('SUPPORT')], r[headers.indexOf('RESISTANCE')]);
  });
}

main().catch(console.error);
