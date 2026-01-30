const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

async function run() {
  const keyPath = path.join('market-pulse-dashboard-main', 'secerate_googlekey', 'key-partition-484615-n5-52acc9edc675.json');
  if (!fs.existsSync(keyPath)) {
      console.error('Key file not found at:', keyPath);
      return;
  }
  const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });
  const sheets = google.sheets({ version: 'v4', auth });
  
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: EOD_SHEET_ID,
      range: 'lasa-master!A1:FJ1'
    });
    console.log('HEADERS:', JSON.stringify(res.data.values[0]));
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

run();
