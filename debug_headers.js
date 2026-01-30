const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function debugHeaders() {
  const keyPath = path.join(process.cwd(), 'secerate_googlekey', 'key-partition-484615-n5-52acc9edc675.json');
  const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] });
  const sheets = google.sheets({ version: 'v4', auth });
  const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';
  
  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: EOD_SHEET_ID, range: 'current!A1:FJ1' });
    const headers = res.data.values[0];
    const map = {};
    headers.forEach((h, i) => {
      const col = (i + 1);
      let label = '';
      let n = col;
      while (n > 0) {
        let m = (n - 1) % 26;
        label = String.fromCharCode(65 + m) + label;
        n = Math.floor((n - m) / 26);
      }
      map[label] = h;
    });
    console.log(JSON.stringify(map, null, 2));
  } catch (err) {
    console.error(err);
  }
}

debugHeaders();
