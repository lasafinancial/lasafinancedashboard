const { google } = require('googleapis');
const path = require('path');

const EOD_SHEET_ID = process.env.EOD_SHEET_ID || '1l-2Y8DkQW65Zf5NncH368Kk-nOfqMtsuV9W9n5Vj11E';

function getCredentials() {
  return {
    client_email: process.env.FIREBASE_CLIENT_EMAIL || "lasa-806@lasa-415609.iam.gserviceaccount.com",
    private_key: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, '\n'),
  };
}

async function test() {
  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: "'intraday-commentry'!A1:Z5",
  });
  
  console.log(res.data.values);
}

test();
