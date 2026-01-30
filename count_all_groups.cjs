const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function debug() {
  const keyPath = path.join(__dirname, 'secerate_googlekey', 'key-partition-484615-n5-52acc9edc675.json');
  const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  
  const sheets = google.sheets({ version: 'v4', auth });
  const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';
  
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: "'current'!A:S",
  });
  
  const headers = res.data.values[0];
  const groupIdx = headers.indexOf('GROUP');
  
  const counts = {};
  res.data.values.slice(1).forEach(row => {
    const group = (row[groupIdx] || '').toUpperCase();
    counts[group] = (counts[group] || 0) + 1;
  });
  
  console.log('All Group counts:', counts);
}

debug().catch(console.error);
