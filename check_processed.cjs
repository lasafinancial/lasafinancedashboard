const data = require('./src/data/processed/stock_data.json');
const nifty = data.find(s => s.symbol === 'NIFTY 50');
console.log('Total stocks:', data.length);
console.log('NIFTY history length:', nifty?.history?.length);
if (nifty?.history?.length > 0) { 
  console.log('First date:', nifty.history[0].date); 
  console.log('Last date:', nifty.history[nifty.history.length-1].date);
  console.log('Sample with wolfeD:', nifty.history.filter(h => h.wolfeD != null).slice(-5));
}
