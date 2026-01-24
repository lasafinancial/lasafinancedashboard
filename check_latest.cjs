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
  const dateIdx = headers.indexOf('DATE');
  const stockNameIdx = headers.indexOf('STOCK_NAME');
  const fjIdx = headers.indexOf('RESISTANCE_SLOPE_DOWNWARD');
  
  const output = [];
  output.push('DATE column index: ' + dateIdx);
  output.push('STOCK_NAME column index: ' + stockNameIdx);
  output.push('RESISTANCE_SLOPE_DOWNWARD column index: ' + fjIdx);
  
  const dates = [...new Set(rows.slice(1).map(r => r[dateIdx]).filter(Boolean))];
  output.push('Unique dates in lasa-master: ' + dates.length);
  output.push('Sample dates: ' + dates.slice(0, 5).join(', '));
  output.push('Last dates: ' + dates.slice(-5).join(', '));
  
  const latestDate = dates[dates.length - 1];
  output.push('Latest date: ' + latestDate);
  
  let latestTrue = 0, latestFalse = 0;
  const latestStocks = {};
  rows.slice(1).forEach(row => {
    if (row[dateIdx] === latestDate) {
      const stockName = row[stockNameIdx];
      const fjVal = (row[fjIdx] || '').toString().toLowerCase();
      latestStocks[stockName] = fjVal === 'true';
      if (fjVal === 'true') latestTrue++;
      else latestFalse++;
    }
  });
  
  output.push('Stocks on latest date: ' + Object.keys(latestStocks).length);
  output.push('TRUE on latest date: ' + latestTrue);
  output.push('FALSE on latest date: ' + latestFalse);
  
  const stockData = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/data/processed/stock_data.json')));
  let matchTrue = 0, matchFalse = 0, noMatch = 0;
  stockData.forEach(s => {
    if (latestStocks[s.symbol] === true) matchTrue++;
    else if (latestStocks[s.symbol] === false) matchFalse++;
    else noMatch++;
  });
  
  output.push('');
  output.push('Matching latest date with stock_data.json:');
  output.push('TRUE: ' + matchTrue + ', FALSE: ' + matchFalse + ', No match: ' + noMatch);
  
  fs.writeFileSync(path.join(__dirname, 'check_latest_result.txt'), output.join('\n'));
}
check();
