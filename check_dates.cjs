const d = require('./src/data/processed/stock_data.json');
const dates = new Set();
d.forEach(s => s.history && s.history.forEach(h => dates.add(h.date)));
console.log('Available dates:', [...dates].sort());
