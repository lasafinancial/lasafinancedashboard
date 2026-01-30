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
    
    console.log('Total rows:', rows.length);
    
    const uniqueValues = new Set();
    rows.slice(1).forEach(row => {
        if (row[isMbIdx] !== undefined) {
            uniqueValues.add(row[isMbIdx]);
        }
    });
    console.log('Unique values in IS_MB:', Array.from(uniqueValues));

    const nonZero = rows.filter(row => row[isMbIdx] !== '0' && row[isMbIdx] !== undefined && row[isMbIdx] !== '');
    console.log('Number of non-zero/non-empty IS_MB rows:', nonZero.length);
    if (nonZero.length > 0) {
        console.log('Sample non-zero row:', JSON.stringify(nonZero[0].slice(0, 5)), 'IS_MB:', nonZero[0][isMbIdx]);
    }

  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

run();
