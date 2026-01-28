const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

function getCredentials() {
  const keyPath = path.join(__dirname, 'secerate_googlekey', 'key-partition-484615-n5-52acc9edc675.json');
  return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
}

async function check() {
  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  console.log('Checking "current" sheet columns...');
  const currentRes = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: "'current'!A1:FJ5",
  });
  const headers = currentRes.data.values[0] || [];
  
  // Column BG in Excel is index 58 (0-indexed)
  // A=0, B=1, ..., Z=25, AA=26, AB=27, ..., AZ=51, BA=52, BB=53, ..., BG=58
  console.log('Column at index 58 (BG in Excel):', headers[58]);
  console.log('Sample values at index 58:');
  for (let i = 1; i < currentRes.data.values.length; i++) {
    console.log('  Row', i, ':', currentRes.data.values[i][58]);
  }
  
  // Also check UPPER_RANGE and LOWER_RANGE
  const upperIdx = headers.indexOf('UPPER_RANGE');
  const lowerIdx = headers.indexOf('LOWER_RANGE');
  console.log('\nUPPER_RANGE column index:', upperIdx);
  console.log('LOWER_RANGE column index:', lowerIdx);
  
  if (upperIdx >= 0 && lowerIdx >= 0) {
    console.log('\nSample UPPER/LOWER RANGE values:');
    for (let i = 1; i < currentRes.data.values.length; i++) {
      const row = currentRes.data.values[i];
      console.log('  Row', i, '- Stock:', row[3], 'UPPER:', row[upperIdx], 'LOWER:', row[lowerIdx]);
    }
  }
  
  // Check STATUS column
  const statusIdx = headers.indexOf('STATUS');
  console.log('\nSTATUS column index:', statusIdx);
  if (statusIdx >= 0) {
    console.log('Sample STATUS values:');
    for (let i = 1; i < currentRes.data.values.length; i++) {
      console.log('  Row', i, ':', currentRes.data.values[i][statusIdx]);
    }
  }
}

check().catch(console.error);
