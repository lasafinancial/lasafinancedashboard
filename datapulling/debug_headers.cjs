const { google } = require('googleapis');
const path = require('path');
const KEY_FILE = path.join(__dirname, '..', 'key-partition-484615-n5-67743fa5e288.json');
const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({ 
    spreadsheetId: EOD_SHEET_ID, 
    range: 'lasa-master!A1:FJ1' 
  });
  console.log('Headers (A-FJ):');
  console.log(JSON.stringify(res.data.values[0]));
}
main();
