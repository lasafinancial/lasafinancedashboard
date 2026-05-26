const { google } = require('googleapis');
const credentials = require('../key-partition-484615-n5-67743fa5e288.json');
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
});
const sheets = google.sheets({ version: 'v4', auth });
sheets.spreadsheets.values.get({
  spreadsheetId: '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I',
  range: 'intraday-summary!A1:Z1'
}).then(res => console.log(res.data.values[0])).catch(console.error);
