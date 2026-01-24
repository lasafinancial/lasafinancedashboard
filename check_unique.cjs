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
  
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: 'lasa-master!A1:FJ20300',
  });
  
  const rows = res.data.values;
  const headers = rows[0];
  const stockNameIdx = headers.indexOf('STOCK_NAME');
  const fjIdx = headers.indexOf('RESISTANCE_SLOPE_DOWNWARD');
  
  const output = [];
  output.push('Total rows in lasa-master: ' + (rows.length - 1));
  
  const uniqueStocks = {};
  rows.slice(1).forEach(row => {
    const stockName = row[stockNameIdx];
    if (stockName && !uniqueStocks[stockName]) {
      const fjVal = (row[fjIdx] || '').toString().toLowerCase();
      uniqueStocks[stockName] = fjVal === 'true';
    }
  });
  
  output.push('Unique stock names: ' + Object.keys(uniqueStocks).length);
  
  let trueCount = 0, falseCount = 0;
  Object.values(uniqueStocks).forEach(v => v ? trueCount++ : falseCount++);
  output.push('Unique TRUE: ' + trueCount + ', Unique FALSE: ' + falseCount);
  
  const stockData = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/data/processed/stock_data.json')));
  const jsonStocks = stockData.map(s => s.symbol);
  
  let matchTrue = 0, matchFalse = 0, noMatch = 0;
  jsonStocks.forEach(s => {
    if (uniqueStocks[s] === true) matchTrue++;
    else if (uniqueStocks[s] === false) matchFalse++;
    else noMatch++;
  });
  
  output.push('');
  output.push('Matching with stock_data.json stocks:');
  output.push('TRUE: ' + matchTrue + ', FALSE: ' + matchFalse + ', No match: ' + noMatch);
  
  fs.writeFileSync(path.join(__dirname, 'check_result.txt'), output.join('\n'));
  console.log('Results written to check_result.txt');
}
check();
