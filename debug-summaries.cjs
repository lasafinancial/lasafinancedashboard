const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

function getCredentials() {
  let credentials;
  const keyPath = path.join(__dirname, 'secerate_googlekey', 'key-partition-484615-n5-3411b9e54bd0.json');
  if (fs.existsSync(keyPath)) {
    try {
      credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    } catch (e) {
      console.error('Failed to parse Google key file:', e.message);
    }
  }
  return credentials;
}

async function debugSummaries() {
  const credentials = getCredentials();
  if (!credentials) {
    console.error('No credentials found.');
    return;
  }
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const INDICES_SHEET_ID = '1EHB65PXFold-zCt-QkMzI_nfbZTuy4hEeS9G1naXhZQ';
  
  try {
    console.log('Fetching Summaries!A:Z ...');
    const summariesRes = await sheets.spreadsheets.values.get({
      spreadsheetId: INDICES_SHEET_ID,
      range: 'Summaries!A:Z',
    });
    const rows = summariesRes.data.values || [];
    console.log(`Found ${rows.length} rows.`);
    if (rows.length > 0) {
      console.log('Headers:', rows[0]);
      if (rows.length > 1) {
        console.log('Row 1:', rows[1]);
      }
    }
  } catch (err) {
    console.error('Error fetching Summaries tab:', err.message);
  }
}

debugSummaries();
