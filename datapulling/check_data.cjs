const d = require('../src/data/processed/stock_data.json');
const symbols = Object.keys(d.stockHistory);
const h = d.stockHistory[symbols[0]];
console.log('Symbol:', symbols[0]);
h.slice(-10).forEach(r => console.log(r.date, 'ml:', r.mlFutPrice20d, 'wolfe:', r.wolfeD, 'fvg:', r.projFvg));
