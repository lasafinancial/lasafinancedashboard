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

  console.log('Checking "current" sheet headers...');
  const currentRes = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: "'current'!A1:FJ1",
  });
  const currentHeaders = currentRes.data.values[0] || [];
  console.log('Current headers count:', currentHeaders.length);
  console.log('Current headers (sample):', currentHeaders.slice(0, 10));
  console.log('NIFTY50 in current?', currentHeaders.includes('NIFTY50'));
  console.log('Column 78 (CA):', currentHeaders[78]);

  console.log('\nChecking "lasa-master" sheet headers...');
  const lasaRes = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: 'lasa-master!A1:FJ1',
  });
  const lasaHeaders = lasaRes.data.values[0] || [];
  console.log('Lasa-master headers count:', lasaHeaders.length);
  console.log('NIFTY50 in lasa-master?', lasaHeaders.includes('NIFTY50'));
  console.log('Column 78 (CA):', lasaHeaders[78]);
}

check().catch(console.error);
