const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'secerate_googlekey', 'key-partition-484615-n5-52acc9edc675.json'), 'utf8'));
const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] });
const sheets = google.sheets({ version: 'v4', auth });

async function verify() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I',
    range: 'current!A:T'
  });
  
  const headers = res.data.values[0];
  const nameIdx = headers.indexOf('STOCK_NAME');
  const groupIdx = headers.indexOf('GROUP');
  const changeIdx = headers.indexOf('CHANGE_PERCENT');
  
  // Stocks from UI screenshot to verify
  const stocksToCheck = ['HINDCOPPER', 'DATAPATTS', 'TEJASNET', 'OLECTRA', 'MOTILALOFS', 
                         'TATACONSUM', 'RADICO', 'ASIANPAINT', 'EICHERMOT', 'AKZOINDIA',
                         'SCHNEIDER', 'CGPOWER', 'OIL', 'BEML', 'ONGC',
                         'BRITANNIA', 'BERGEPAINT', 'WESTLIFE', 'BLS', 'CREDITACC'];
  
  console.log('=== VERIFICATION: Are UI stocks Large/Mid Cap? ===\n');
  
  const found = [];
  res.data.values.slice(1).forEach(row => {
    const name = row[nameIdx];
    if (stocksToCheck.some(s => name && name.toUpperCase().includes(s.toUpperCase()))) {
      found.push({ name, group: row[groupIdx], change: row[changeIdx] });
    }
  });
  
  found.forEach(s => {
    const status = (s.group === 'LARGECAP' || s.group === 'MIDCAP') ? '✓' : '✗ ERROR';
    console.log(`${status} ${s.name} => GROUP: ${s.group} | CHANGE: ${s.change}`);
  });
  
  // Counter-check: Find top SMALLCAP stocks - these should NOT appear in UI
  console.log('\n=== COUNTER-CHECK: Top SMALLCAP gainers (should NOT be in UI) ===');
  const smallCapStocks = res.data.values.slice(1)
    .filter(row => row[groupIdx] === 'SMALLCAP')
    .map(row => ({ name: row[nameIdx], group: row[groupIdx], change: parseFloat(row[changeIdx]) || 0 }))
    .sort((a, b) => b.change - a.change)
    .slice(0, 5);
  
  smallCapStocks.forEach(s => {
    console.log(`${s.name} => GROUP: ${s.group} | CHANGE: ${s.change}%`);
  });
  
  console.log('\nIf any SMALLCAP stock above has higher % than UI top gainers, filter is working correctly by excluding them.');
}

verify().catch(console.error);
