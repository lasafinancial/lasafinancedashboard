// Test to check actual breakout dates and what stocks would be NEW on the board
const https = require('https');

const ALLSTOCKS_SHEET_ID = '1uibGhhv6Zdil2aWk17fcq1U-csYUffBdQv3Relrgfog';
const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

function fetchWithKey(sheetId, range) {
  // Use service account via googleapis is complex, let's use the deployed API instead
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?key=AIzaSyC0UgPrEbIJkjRXO1Llp7o4MtfhMjqcUlA`;
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
  console.log('Fetching breakout scanner data...');
  const res = await fetchWithKey(EOD_SHEET_ID, 'intraday-breakout-scanner!A1:B50');
  
  if (res.error) {
    console.log('API Key approach failed:', res.error.message);
    console.log('Trying the deployed API instead...');
    
    // Try the deployed endpoint
    const apiUrl = 'https://lasafinancedashboard.vercel.app/api/fetch-data';
    return new Promise((resolve, reject) => {
      https.get(apiUrl, httpRes => {
        let data = '';
        httpRes.on('data', c => data += c);
        httpRes.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            
            // Check intradayBreakoutScanner dates
            console.log('\n=== intradayBreakoutScanner sample (first 10) ===');
            const scanner = parsed.intradayBreakoutScanner || [];
            scanner.slice(0, 10).forEach(s => {
              console.log(`  ${s.symbol}: date="${s.date}"`);
            });
            console.log(`Total scanner entries: ${scanner.length}`);
            
            // Unique dates
            const dates = [...new Set(scanner.map(s => s.date))].sort();
            console.log(`\nUnique dates: ${dates.join(', ')}`);
            
            // Check intradayDev for isNew
            console.log('\n=== intradayDev isNew status ===');
            const dev = parsed.intradayDev || [];
            dev.forEach(s => {
              console.log(`  ${s.symbol}: isNew=${s.isNew}`);
            });
            
            // Check: which symbols on the board are NOT in the scanner at all?
            const scannerSymbols = new Set(scanner.map(s => s.symbol.toUpperCase()));
            const boardSymbols = dev.map(s => s.symbol.toUpperCase());
            console.log('\n=== Board symbols NOT in scanner data ===');
            boardSymbols.forEach(sym => {
              if (!scannerSymbols.has(sym)) {
                console.log(`  ${sym} - NOT in scanner (should be NEW)`);
              }
            });
            
            resolve();
          } catch(e) { reject(e); }
        });
      }).on('error', reject);
    });
  }
  
  console.log('\n=== Breakout Scanner first 50 rows ===');
  if (res.values) {
    res.values.forEach((row, i) => {
      console.log(`Row ${i}: Symbol=${row[0]}, Date=${row[1]}`);
    });
  }
}

main().catch(console.error);
