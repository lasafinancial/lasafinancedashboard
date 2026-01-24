const { google } = require('googleapis');
const path = require('path');

const KEY_FILE = path.join(__dirname, '..', 'key-partition-484615-n5-67743fa5e288.json');
const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  
  const sheetRes = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: "'lasa-master'!A1:FJ500",
  });
  
  const headers = sheetRes.data.values[0];
  console.log('Total columns:', headers.length);
  console.log('Column FJ (166) header:', headers[165]);
  
  console.log('Last 10 columns:');
  for (let i = Math.max(0, headers.length - 10); i < headers.length; i++) {
    console.log('  ' + (i+1) + ': ' + headers[i]);
  }
  
  let trueCount = 0, falseCount = 0;
  const trueStocks = [];
  for (let i = 1; i < sheetRes.data.values.length; i++) {
    const row = sheetRes.data.values[i];
    const val = row[165];
    if (val === 'TRUE') {
      trueCount++;
      if (trueStocks.length < 5) trueStocks.push(row[0]);
    } else if (val === 'FALSE') {
      falseCount++;
    }
  }
  console.log('FJ values - TRUE:', trueCount, 'FALSE:', falseCount);
  console.log('Stocks with TRUE (downward):', trueStocks.join(', '));
}

main().catch(console.error);
