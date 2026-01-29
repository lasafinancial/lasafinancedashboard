
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

function getCredentials() {
  const keyPath = path.join(__dirname, 'secerate_googlekey', 'key-partition-484615-n5-52acc9edc675.json');
  return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
}

async function inspect() {
  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: "'current'!A1:ZZ500",
  });

  const rows = res.data.values;
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

  console.log('Total mood stocks:', moodStocks.length);
  
  const counts = { BULLISH: 0, BEARISH: 0, NEUTRAL: 0, EMPTY: 0 };
  moodStocks.forEach(s => {
    const status = (s['STATUS'] || 'EMPTY').toUpperCase();
    if (counts[status] !== undefined) counts[status]++;
    else counts.NEUTRAL++;
  });
  
  console.log('Counts:', counts);
  
  const hind = data.find(r => (r['STOCK_NAME'] || '').includes('HINDCOPPER'));
  console.log('HINDCOPPER:', hind ? { name: hind['STOCK_NAME'], change: hind['CHANGE_PERCENT'], status: hind['STATUS'] } : 'Not found');
}

inspect();
