const { google } = require('googleapis');
const path = require('path');

const KEY_FILE = path.join(__dirname, '..', 'key-partition-484615-n5-67743fa5e288.json');
const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

async function main() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get first row (headers) and first 5 data rows
    const sheetRes = await sheets.spreadsheets.values.get({
      spreadsheetId: EOD_SHEET_ID,
      range: 'lasa-master!A1:FJ10',
    });
    
    const rows = sheetRes.data.values;
    const headers = rows[0];
    
    console.log('Headers around 139 (FJ):');
    for (let i = 135; i <= 145; i++) {
      console.log('  ' + i + ': ' + headers[i]);
    }

    console.log('\nHeaders around 165 (GJ):');
    for (let i = 160; i <= 170; i++) {
      console.log('  ' + i + ': ' + headers[i]);
    }
    
    // Find SYMBOL column
    const symbolIndex = headers.findIndex(h => h && h.toUpperCase() === 'SYMBOL');
    const resSlopeIndex = headers.findIndex(h => h && h.toUpperCase() === 'RESISTANCE_SLOPE_DOWNWARD');
    
    console.log('\nSYMBOL column index:', symbolIndex);
    console.log('RESISTANCE_SLOPE_DOWNWARD column index:', resSlopeIndex);
    
    // Print sample data
    console.log('\n--- Sample data ---');
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const symbol = symbolIndex >= 0 ? row[symbolIndex] : 'N/A';
      const fj = resSlopeIndex >= 0 ? row[resSlopeIndex] : 'N/A';
      console.log('Row ' + r + ': SYMBOL=' + symbol + ', FJ=' + fj);
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

main();
