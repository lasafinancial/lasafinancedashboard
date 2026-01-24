const { google } = require('googleapis');
const path = require('path');
const KEY_FILE = path.join(__dirname, '..', 'key-partition-484615-n5-67743fa5e288.json');
const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });
  const sheets = google.sheets({ version: 'v4', auth });
  
  console.log('Looking for Reversal indicators...\n');
  const res = await sheets.spreadsheets.values.get({ 
    spreadsheetId: EOD_SHEET_ID, 
    range: "'current'!A1:DZ10" 
  });
  
  const headers = res.data.values[0];
  console.log('Total columns:', headers.length);
  
  const keywords = ['HIEKEN', 'TREND', 'SIGNAL', 'REVERSAL', 'CHANGE', 'WOLFE', 'SWING'];
  
  console.log('\n=== REVERSAL-RELATED COLUMNS ===\n');
  
  headers.forEach((h, i) => {
    const colName = (h || '').toString().toUpperCase();
    const matchedKeyword = keywords.find(k => colName.includes(k));
    if (matchedKeyword) {
      let col;
      if (i < 26) col = String.fromCharCode(65 + i);
      else if (i < 52) col = 'A' + String.fromCharCode(65 + i - 26);
      else if (i < 78) col = 'B' + String.fromCharCode(65 + i - 52);
      else if (i < 104) col = 'C' + String.fromCharCode(65 + i - 78);
      else col = 'D' + String.fromCharCode(65 + i - 104);
      
      const sampleData = res.data.values.slice(1, 8).map(row => row[i] || '').join(' | ');
      console.log(`[${col}] ${h}`);
      console.log(`    Samples: ${sampleData}\n`);
    }
  });
}
main();
