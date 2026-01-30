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
    
    const mbRows = rows.filter(row => row[isMbIdx] === 'Y' || row[isMbIdx] === '1' || row[isMbIdx] === 1);
    console.log(`Found ${mbRows.length} Multibagger rows in total.`);
    if (mbRows.length > 0) {
        console.log('Sample MB row:', JSON.stringify(mbRows[0]));
        console.log('IS_MB Value in sample:', mbRows[0][isMbIdx]);
    }

    // Check latest date
    const allDates = [...new Set(rows.slice(1).map(r => r[0]).filter(Boolean))];
    const latestDate = allDates.sort((a, b) => new Date(b) - new Date(a))[0];
    console.log('Latest Date:', latestDate);
    
    const latestMbRows = mbRows.filter(row => row[0] === latestDate);
    console.log(`Found ${latestMbRows.length} Multibagger rows for latest date.`);

  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

run();
