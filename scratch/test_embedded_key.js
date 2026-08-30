import { google } from 'googleapis';
import { getGoogleCredentialsHelper } from '../api/credentialsHelper.js';

async function testKey() {
  console.log('Testing embedded key authentication...');
  const credentials = getGoogleCredentialsHelper();
  console.log('Client Email:', credentials.client_email);
  console.log('Private key exists:', !!credentials.private_key);
  console.log('Private key length:', credentials.private_key.length);
  console.log('Private key starts with:', credentials.private_key.slice(0, 30));

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: EOD_SHEET_ID,
      range: "'current'!A1:B5",
    });
    console.log('SUCCESS! Google Sheets API returned:', res.data.values);
  } catch (err) {
    console.error('FAILED TO FETCH GOOGLE SHEETS:', err);
  }
}

testKey();
