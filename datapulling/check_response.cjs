const d = require('../temp_response.json');

console.log('=== TOP GAINERS (Large Cap + Mid Cap only) ===');
d.topMovers.topGainers.forEach((s, i) => {
  console.log(`${i+1}. ${s.stockName}: ${s.changePercent}%`);
});

console.log('\n=== TOP LOSERS (Large Cap + Mid Cap only) ===');
d.topMovers.topLosers.forEach((s, i) => {
  console.log(`${i+1}. ${s.stockName}: ${s.changePercent}%`);
});
