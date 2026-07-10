// Test to check actual deployed API for isNew status
const https = require('https');

function fetchAPI() {
  return new Promise((resolve, reject) => {
    https.get('https://lasafinance.vercel.app/api/fetch-data', res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { 
          console.log('Raw response (first 500 chars):', data.substring(0, 500));
          reject(e); 
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching from live API...');
  const d = await fetchAPI();
  
  // Check intradayBreakoutScanner dates
  const scanner = d.intradayBreakoutScanner || [];
  console.log(`\nTotal scanner entries: ${scanner.length}`);
  
  // Sample dates
  const dates = [...new Set(scanner.map(s => s.date))].sort();
  console.log(`Unique dates (${dates.length}):`, dates);
  
  // Check intradayDev for isNew
  const dev = d.intradayDev || [];
  console.log(`\nTotal board stocks: ${dev.length}`);
  
  let newCount = 0;
  dev.forEach(s => {
    if (s.isNew) newCount++;
    console.log(`  ${s.symbol.padEnd(15)} isNew=${String(s.isNew).padEnd(6)} date=${s.date}`);
  });
  
  console.log(`\nStocks with isNew=true: ${newCount} / ${dev.length}`);
  
  if (newCount === 0) {
    console.log('\n--- Diagnosing why all stocks are NOT new ---');
    // For the first board stock, show which scanner entries match
    if (dev.length > 0) {
      const testSym = dev[0].symbol;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0,0,0,0);
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const matches = scanner.filter(s => s.symbol.toUpperCase() === testSym);
      console.log(`\n${testSym} has ${matches.length} entries in scanner:`);
      matches.forEach(m => {
        let d2 = new Date(m.date);
        console.log(`  date="${m.date}" parsed=${d2.toISOString()} valid=${!isNaN(d2.getTime())} beforeToday=${d2<today} after30d=${d2>=thirtyDaysAgo}`);
      });
    }
  }
}

main().catch(console.error);
