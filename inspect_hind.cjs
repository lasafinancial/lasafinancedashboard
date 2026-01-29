
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
    range: "'current'!A1:BG",
  });

  const rows = res.data.values;
  const headers = rows[0];
  const data = rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  const hind = data.find(r => r['STOCK_NAME'] === 'HINDCOPPER');
  console.log('HINDCOPPER:', hind ? { name: hind['STOCK_NAME'], change: hind['CHANGE_PERCENT'], group: hind['GROUP'] } : 'Not found');

  const top10 = data
    .filter(row => {
        const group = (row['GROUP'] || '').toString().toUpperCase();
        return group === 'LARGECAP' || group === 'MIDCAP';
    })
    .map(row => ({
      name: row['STOCK_NAME'],
      change: row['CHANGE_PERCENT']
    }))
    .sort((a, b) => {
       const ca = parseFloat((a.change || '0').toString().replace('%', ''));
       const cb = parseFloat((b.change || '0').toString().replace('%', ''));
       return cb - ca;
    })
    .slice(0, 10);
    
  console.log('Top 10 Gainers (Large/Mid):', top10);
}

inspect();
