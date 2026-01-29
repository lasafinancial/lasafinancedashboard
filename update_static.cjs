
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

function getCredentials() {
  const keyPath = path.join(__dirname, 'secerate_googlekey', 'key-partition-484615-n5-52acc9edc675.json');
  return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
}

async function updateStatic() {
  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  console.log('Fetching data for static update...');
  const currentRes = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: "'current'!A1:ZZ500",
  });

  const rows = currentRes.data.values;
  const headers = rows[0];
  const data = rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  const moodStocks = data.slice(0, 470).filter(row => {
    const group = (row['GROUP'] || '').toString().toUpperCase();
    return group === 'LARGECAP' || group === 'MIDCAP';
  });

  let bull = 0, bear = 0, neut = 0;
  moodStocks.forEach(s => {
    const status = (s['STATUS'] || '').toUpperCase();
    if (status === 'BULLISH') bull++;
    else if (status === 'BEARISH') bear++;
    else neut++;
  });

  const total = moodStocks.length;
  const marketMood = {
    bullish: (bull / total) * 100,
    bearish: (bear / total) * 100,
    neutral: (neut / total) * 100,
    date: '28th Jan'
  };

  const stocks = data
    .filter(row => {
      const group = (row['GROUP'] || '').toString().toUpperCase();
      return group === 'LARGECAP' || group === 'MIDCAP';
    })
    .map(row => ({
      id: row['ID'] || row['STOCK_NAME'],
      stockName: row['STOCK_NAME'],
      changePercent: parseFloat((row['CHANGE_PERCENT'] || '0').toString().replace('%', '')) || 0,
      closePrice: parseFloat((row['CLOSE_PRICE'] || '0').toString().replace(/,/g, '')) || 0
    }))
    .filter(s => s.stockName && !isNaN(s.changePercent));

  const sorted = [...stocks].sort((a, b) => b.changePercent - a.changePercent);
  const topMovers = {
    topGainers: sorted.filter(s => s.changePercent > 0).slice(0, 10),
    topLosers: sorted.filter(s => s.changePercent < 0).slice(-10).reverse()
  };

  console.log('Updating static files...');
  fs.writeFileSync('src/data/processed/market_mood.json', JSON.stringify(marketMood, null, 2));
  fs.writeFileSync('src/data/processed/top_movers.json', JSON.stringify(topMovers, null, 2));
  console.log('Static files updated.');
}

updateStatic();
