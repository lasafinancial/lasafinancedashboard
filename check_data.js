const d = require('./src/data/processed/stock_data.json');
console.log('Total stocks:', d.length);
console.log('First stock history length:', d[0]?.history?.length);
console.log('Sample dates:', d[0]?.history?.slice(0,5).map(h=>h.date));
console.log('Last dates:', d[0]?.history?.slice(-5).map(h=>h.date));
