const { google } = require('googleapis');
const admin = require('firebase-admin');
const fs = require('fs');

async function testFetch() {
  try {
    // Mimic getCredentials()
    const credentialsStr = fs.readFileSync('service-account.json', 'utf8');
    const credentials = JSON.parse(credentialsStr);
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

    console.log('Fetching allstocks...');
    const allstocksRes = await sheets.spreadsheets.values.get({
      spreadsheetId: EOD_SHEET_ID,
      range: "'allstocks'!A1:FZ"
    });
    
    const rows = allstocksRes.data.values;
    if (!rows) {
      console.log('No rows returned for allstocks.');
      return;
    }
    
    console.log(`Fetched ${rows.length} rows.`);
    console.log(`Header row length: ${rows[0].length}`);
    const obvIndex = rows[0].indexOf('OBV_SIGNAL');
    console.log(`Index of OBV_SIGNAL header: ${obvIndex}`);
    
    if (rows.length > 1) {
      console.log(`Row 1 OBV value: ${rows[1][obvIndex]}`);
    }

  } catch (e) {
    console.error('Fetch failed:', e.message);
  }
}

testFetch();
