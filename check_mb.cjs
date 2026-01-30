const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

function getCredentials() {
  const keyPath = path.join(__dirname, 'secerate_googlekey', 'key-partition-484615-n5-52acc9edc675.json');
  if (fs.existsSync(keyPath)) {
    return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  }
  throw new Error('No Google credentials found');
}

async function checkMultibaggerData() {
  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: "'current'!A1:FJ500", // Check first 500 rows
  });
  
  const rows = response.data.values;
  const headers = rows[0];
  const isMbIdx = headers.indexOf('IS_MB');
  const idIdx = headers.indexOf('ID');
  
  console.log(`IS_MB column index: ${isMbIdx}`);
  
  const mbStocks = rows.slice(1).filter(row => {
    const val = row[isMbIdx];
    return val && (val.toString().toUpperCase() === 'TRUE' || val === '1' || val === 1);
  });
  
  console.log(`Found ${mbStocks.length} multibagger candidates using IS_MB filter.`);
  if (mbStocks.length > 0) {
    console.log('Sample MB stocks:', mbStocks.slice(0, 5).map(r => r[idIdx]));
  } else {
    // If IS_MB is empty, maybe they use another column?
    // Let's check some rows to see if IS_MB has values
    console.log('Sample IS_MB values:', rows.slice(1, 10).map(r => r[isMbIdx]));
  }
}

checkMultibaggerData().catch(console.error);
