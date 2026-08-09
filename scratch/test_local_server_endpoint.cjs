const http = require('http');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, { timeout: 60000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse error: ' + data.substring(0, 500))); }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching from local server (http://localhost:3001/api/fetch-data?force=true)...');
  const data = await fetchJson('http://localhost:3001/api/fetch-data?force=true');
  
  console.log(`stockData count: ${data.stockData ? data.stockData.length : 'N/A'}`);
  
  if (data.stockData && data.stockData.length > 0) {
    // Check first item's keys
    const firstItem = data.stockData[0];
    console.log(`\nKeys on stockData[0]:`, Object.keys(firstItem));
    console.log(`stockData[0]:`, JSON.stringify(firstItem, null, 2).substring(0, 500));
    
    // Check if obvSignal/fr exist
    const hasObv = data.stockData.some(s => s.obvSignal && s.obvSignal !== '—');
    const hasFr = data.stockData.some(s => s.fr && s.fr !== '—');
    console.log(`\nAny stockData item has obvSignal (not —): ${hasObv}`);
    console.log(`Any stockData item has fr (not —): ${hasFr}`);
    
    // Count matches
    let matchCount = 0;
    const matches = [];
    data.stockData.forEach(s => {
      const isYes = String(s.fr || '').toUpperCase() === 'YES';
      const isAcc = String(s.obvSignal || '').toUpperCase() === 'ACCUMULATION' || String(s.obvSignal || '').toUpperCase() === 'BULLISH';
      if (isYes && isAcc) {
        matchCount++;
        if (matches.length < 10) matches.push({ symbol: s.symbol, fr: s.fr, obvSignal: s.obvSignal });
      }
    });
    console.log(`\nMatching stocks (fr=YES + obvSignal=ACCUMULATION/BULLISH): ${matchCount}`);
    console.log('Sample matches:', matches);
  }
  
  console.log(`\nintradayBreakoutScanner count: ${data.intradayBreakoutScanner ? data.intradayBreakoutScanner.length : 'N/A'}`);
  if (data.intradayBreakoutScanner && data.intradayBreakoutScanner.length > 0) {
    const first = data.intradayBreakoutScanner[0];
    console.log(`intradayBreakoutScanner[0] keys:`, Object.keys(first));
    console.log(`intradayBreakoutScanner[0]:`, JSON.stringify(first, null, 2).substring(0, 500));

    let matchCount = 0;
    const matches = [];
    data.intradayBreakoutScanner.forEach(s => {
      const isYes = String(s.fr || '').toUpperCase() === 'YES';
      const isAcc = String(s.obvSignal || '').toUpperCase() === 'ACCUMULATION' || String(s.obvSignal || '').toUpperCase() === 'BULLISH';
      if (isYes && isAcc) {
        matchCount++;
        if (matches.length < 5) matches.push({ symbol: s.symbol, fr: s.fr, obvSignal: s.obvSignal });
      }
    });
    console.log(`\nintradayBreakoutScanner matching stocks: ${matchCount}`);
    console.log('Sample:', matches);
  }
}

main().catch(e => console.error('ERROR:', e.message));
