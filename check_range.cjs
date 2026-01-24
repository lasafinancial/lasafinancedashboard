const d = require('./src/data/processed/market_strength.json');
console.log('Total entries:', d.length);
console.log('First:', d[0].date);
console.log('Last:', d[d.length-1].date);
