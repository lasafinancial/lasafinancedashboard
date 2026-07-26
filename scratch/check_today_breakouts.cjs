const https = require('https');

const url = 'https://lasafinance.vercel.app/api/fetch-data';

console.log('Fetching from API...');
https.get(url, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      const scanner = data.intradayBreakoutScanner || [];
      console.log(`Total intradayBreakoutScanner records: ${scanner.length}`);
      
      const uniqueDates = [...new Set(scanner.map(s => s.date))].sort();
      console.log(`Unique dates: ${JSON.stringify(uniqueDates)}`);
      
      // Check for July 15 specifically
      const jul15 = scanner.filter(s => {
        const d = s.date || '';
        return d.includes('15') && (d.includes('Jul') || d.includes('07') || d.includes('7'));
      });
      console.log(`Records matching Jul 15 pattern: ${jul15.length}`);
      if (jul15.length > 0) {
        console.log('Sample Jul 15 records:', jul15.slice(0, 5).map(s => ({ sym: s.symbol, date: s.date, time: s.time })));
      }
      
      // Show last 5 records
      console.log('\nLast 5 scanner records:');
      scanner.slice(-5).forEach(s => {
        console.log(`  ${s.symbol} | date: ${s.date} | time: ${s.time}`);
      });
      
      // Show first 5 records
      console.log('\nFirst 5 scanner records:');
      scanner.slice(0, 5).forEach(s => {
        console.log(`  ${s.symbol} | date: ${s.date} | time: ${s.time}`);
      });
    } catch (e) {
      console.error('Parse error:', e.message);
      console.log('Body length:', body.length);
      console.log('Body start:', body.substring(0, 200));
    }
  });
}).on('error', e => console.error('Request error:', e.message));
