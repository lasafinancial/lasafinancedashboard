const d = require('./src/data/processed/stock_data.json');
let t = 0, f = 0, u = 0;
d.forEach(s => {
  if (s.resistanceSlopeDownward === true) t++;
  else if (s.resistanceSlopeDownward === false) f++;
  else u++;
});
console.log('TRUE:', t, 'FALSE:', f, 'undefined:', u);
console.log('Total stocks:', d.length);

// Show some TRUE examples
console.log('\nStocks with TRUE:');
d.filter(s => s.resistanceSlopeDownward === true).slice(0, 10).forEach(s => console.log(s.symbol));
