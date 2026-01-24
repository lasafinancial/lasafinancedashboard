const data = require('./src/data/processed/stock_data.json');
const nifty = data.find(s => s.symbol === 'NIFTY 50');
const patterns = nifty.history.map((h,i) => ({i, date: h.date, wolfeD: h.wolfeD})).filter(h => h.wolfeD && h.wolfeD !== 0);
console.log('Pattern entries:', patterns.length);
console.log(patterns);
