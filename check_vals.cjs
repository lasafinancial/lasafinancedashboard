const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

async function run() {
  const keyPath = path.join('secerate_googlekey', 'key-partition-484615-n5-52acc9edc675.json');
  const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });
  const sheets = google.sheets({ version: 'v4', auth });
  
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: EOD_SHEET_ID,
      range: 'lasa-master!A:FJ'
    });
    const rows = res.data.values;
    const headers = rows[0];
    const isMbIdx = headers.indexOf('IS_MB');
    
    const vals = new Set();
    for (let i = 1; i < rows.length; i++) {
        if (rows[i][isMbIdx] !== undefined) vals.add(rows[i][isMbIdx]);
    }
    console.log('UNIQUE_IS_MB_VALUES:', Array.from(vals).join(','));

  } catch (err) {
    console.log('ERROR:', err.message);
  }
}

run();
