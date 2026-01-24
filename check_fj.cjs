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
  
  // Get headers around FJ
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: 'lasa-master!FH1:FL1',
  });
  console.log('Headers around FJ (FH to FL):', res.data.values[0]);
  
  // Get sample values from FJ column
  const valRes = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: 'lasa-master!FJ1:FJ30',
  });
  console.log('FJ column values (first 30):');
  valRes.data.values.forEach((v, i) => console.log(`Row ${i+1}: ${v[0]}`));
  
  // Count TRUE/FALSE in FJ
  const allFJ = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: 'lasa-master!FJ:FJ',
  });
  let trueCount = 0, falseCount = 0, emptyCount = 0;
  allFJ.data.values.slice(1).forEach(row => {
    const val = (row[0] || '').toString().toLowerCase();
    if (val === 'true') trueCount++;
    else if (val === 'false') falseCount++;
    else emptyCount++;
  });
  console.log(`\nFJ Column Stats: TRUE=${trueCount}, FALSE=${falseCount}, Empty/Other=${emptyCount}`);
}
check();
