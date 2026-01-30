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
      range: 'lasa-master!A1:FJ20'
    });
    const rows = res.data.values;
    const headers = rows[0];
    console.log('HEADERS:', JSON.stringify(headers));
    
    // Find IS_MB index
    const isMbIdx = headers.indexOf('IS_MB');
    const signalIdx = headers.indexOf('MULTIBAGGER_SIGNAL');
    console.log('IS_MB Index:', isMbIdx);
    console.log('MULTIBAGGER_SIGNAL Index:', signalIdx);
    
    // Show first 5 rows of relevant columns
    rows.slice(1, 10).forEach(row => {
        console.log(`Row: ${row[0]} (Date: ${row[headers.indexOf('DATE')]}), IS_MB: ${row[isMbIdx]}, SIGNAL: ${row[signalIdx]}`);
    });

  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

run();
