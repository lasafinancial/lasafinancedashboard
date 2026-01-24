const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const KEY_FILE = path.join(__dirname, 'key-partition-484615-n5-67743fa5e288.json');
const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

async function check() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  
  // Get stock names from lasa-master
  const lasaRes = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: 'lasa-master!D:D',
  });
  const lasaStocks = new Set(lasaRes.data.values.slice(1).map(r => r[0]).filter(Boolean));
  console.log('Stock names in lasa-master:', lasaStocks.size);
  console.log('Sample:', [...lasaStocks].slice(0, 10));
  
  // Get stock names from current stock_data.json
  const stockData = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/data/processed/stock_data.json')));
  const jsonStocks = new Set(stockData.map(s => s.symbol));
  console.log('\nStock names in stock_data.json:', jsonStocks.size);
  console.log('Sample:', [...jsonStocks].slice(0, 10));
  
  // Find overlap
  const overlap = [...jsonStocks].filter(s => lasaStocks.has(s));
  console.log('\nOverlapping stocks:', overlap.length);
  console.log('Sample overlap:', overlap.slice(0, 10));
  
  // Check what's in lasa-master but not in stock_data
  const onlyInLasa = [...lasaStocks].filter(s => !jsonStocks.has(s));
  console.log('\nOnly in lasa-master (not in date sheets):', onlyInLasa.length);
  console.log('Sample:', onlyInLasa.slice(0, 20));
}
check();
