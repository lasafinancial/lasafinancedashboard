const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

function getCredentials() {
  const keyPath = path.join(__dirname, 'secerate_googlekey', 'key-partition-484615-n5-3411b9e54bd0.json');
  if (fs.existsSync(keyPath)) {
    return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  }
  return null;
}

async function inspectHeaders() {
  const credentials = getCredentials();
  if (!credentials) {
    console.error('No credentials found');
    return;
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: EOD_SHEET_ID,
      range: 'lasa-master!A1:FJ1',
    });

    const headers = res.data.values[0];
    console.log('Headers (First 10):');
    headers.slice(0, 10).forEach((h, i) => {
      console.log(`Col ${String.fromCharCode(65 + i)}: ${h}`);
    });

    // Specifically Col C
    console.log('\nColumn C (Index 2):', headers[2]);
    console.log('Column AM (Index 38):', headers[38]); // Checking STOCK_NAME
  } catch (err) {
    console.error('Error:', err.message);
  }
}

inspectHeaders();
