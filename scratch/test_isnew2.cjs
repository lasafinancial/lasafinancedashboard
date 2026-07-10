// Quick test to fetch the actual breakout data and check date formats
const https = require('https');

const SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';
const API_KEY = 'AIzaSyC0UgPrEbIJkjRXO1Llp7o4MtfhMjqcUlA';

function fetchSheet(tab, range) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(tab)}${range ? '!' + range : ''}?key=${API_KEY}`;
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  // Check breakout scanner dates
  const breakout = await fetchSheet('intraday-breakout-scanner', 'A1:B20');
  console.log('=== Breakout Scanner first 20 rows (Symbol + Date) ===');
  if (breakout.values) {
    breakout.values.forEach((row, i) => {
      console.log(`Row ${i}: Symbol=${row[0]}, Date=${row[1]}`);
    });
  }

  // Check dev/commentary dates  
  const dev = await fetchSheet('intraday-dev', 'A1:C10');
  console.log('\n=== Intraday Dev first 10 rows ===');
  if (dev.values) {
    dev.values.forEach((row, i) => {
      console.log(`Row ${i}: ${row.join(' | ')}`);
    });
  }

  // Get unique dates from breakout scanner
  const allBreakout = await fetchSheet('intraday-breakout-scanner');
  if (allBreakout.values) {
    const dates = new Set();
    allBreakout.values.slice(1).forEach(row => {
      if (row[1]) dates.add(row[1].toString().trim());
    });
    const sortedDates = [...dates].sort();
    console.log('\n=== Unique dates in breakout scanner ===');
    console.log(sortedDates);
    console.log(`Total unique dates: ${sortedDates.length}`);
    
    // Get unique symbols
    const symbols = new Set();
    allBreakout.values.slice(1).forEach(row => {
      if (row[0]) symbols.add(row[0].toString().trim().toUpperCase());
    });
    console.log(`Total unique symbols: ${symbols.size}`);
    
    // Now check which of the current board stocks are truly "new"
    // A stock is NEW if its FIRST EVER appearance date is today (or within the last 1 day)
    const symbolFirstDate = {};
    allBreakout.values.slice(1).forEach(row => {
      const sym = (row[0] || '').toString().trim().toUpperCase();
      const dateStr = (row[1] || '').toString().trim();
      if (!sym || !dateStr) return;
      
      if (!symbolFirstDate[sym] || dateStr < symbolFirstDate[sym]) {
        symbolFirstDate[sym] = dateStr;
      }
    });
    
    console.log('\n=== First appearance date for each symbol (sample of 20) ===');
    const entries = Object.entries(symbolFirstDate);
    entries.slice(0, 20).forEach(([sym, date]) => {
      console.log(`${sym}: ${date}`);
    });
  }
}

main().catch(console.error);
