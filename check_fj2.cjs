const { google } = require('googleapis');
const path = require('path');
const KEY_FILE = path.join(__dirname, 'key-partition-484615-n5-67743fa5e288.json');
const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

async function check() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  
  // Get column A header and FJ header
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: 'lasa-master!A1:B1',
  });
  console.log('First columns headers:', headerRes.data.values[0]);
  
  // Get stock names and FJ values together
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: 'lasa-master!A1:FJ100',
  });
  
  const headers = res.data.values[0];
  const stockNameIdx = headers.indexOf('STOCK_NAME');
  const fjIdx = headers.indexOf('RESISTANCE_SLOPE_DOWNWARD');
  
  console.log('STOCK_NAME column index:', stockNameIdx);
  console.log('RESISTANCE_SLOPE_DOWNWARD column index:', fjIdx);
  console.log('Expected FJ index (165):', 'FJ'.split('').reduce((acc, c, i) => acc + (c.charCodeAt(0) - 64) * Math.pow(26, 'FJ'.length - 1 - i), 0) - 1);
  
  // Sample data
  console.log('\nSample rows with stock name and FJ value:');
  for (let i = 1; i < 20 && i < res.data.values.length; i++) {
    const row = res.data.values[i];
    const stockName = stockNameIdx >= 0 ? row[stockNameIdx] : 'N/A';
    const fjVal = fjIdx >= 0 ? row[fjIdx] : 'N/A';
    console.log(`${stockName}: ${fjVal}`);
  }
}
check();
