const { google } = require('googleapis');

async function testHeaders() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      project_id: process.env.FIREBASE_PROJECT_ID
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

  try {
    const res = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: EOD_SHEET_ID,
      ranges: ['current!A1:FZ1', 'allstocks!A1:FZ1', 'lasa-master!A1:FZ1']
    });

    res.data.valueRanges.forEach(vr => {
      console.log(`Range: ${vr.range}`);
      const headers = vr.values ? vr.values[0] : [];
      console.log(`Total columns: ${headers.length}`);
      if (headers.length >= 170) {
        console.log(`Column FO (idx 170): ${headers[170]}`);
      } else {
        console.log('Column FO does not exist in this sheet.');
      }
    });

  } catch (err) {
    console.error('Error fetching sheets:', err.message);
  }
}

testHeaders();
