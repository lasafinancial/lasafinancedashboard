
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

function getCredentials() {
  const keyPath = path.join(__dirname, 'secerate_googlekey', 'key-partition-484615-n5-52acc9edc675.json');
  return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
}

async function inspect() {
  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: "'current'!A1:ZZ1",
  });

  console.log('Headers:', res.data.values[0]);
}

inspect();
