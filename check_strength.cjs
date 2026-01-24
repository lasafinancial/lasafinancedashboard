const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./src/data/processed/market_strength.json', 'utf8'));
console.log('Market strength data points:', data.length);
console.log('First date:', data[0]?.date);
console.log('Last date:', data[data.length-1]?.date);
