const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./src/data/processed/stock_data.json', 'utf8'));
const histCounts = data.map(s => s.history?.length || 0);
console.log('Total stocks:', data.length);
console.log('Min history:', Math.min(...histCounts));
console.log('Max history:', Math.max(...histCounts));
console.log('Avg history:', (histCounts.reduce((a,b)=>a+b,0)/histCounts.length).toFixed(1));

const stock40 = data.find(s => s.history?.length >= 40);
if (stock40) {
  console.log('\\nStock with 40+ history:', stock40.symbol);
  console.log('First:', stock40.history[0].date);
  console.log('Last:', stock40.history[stock40.history.length-1].date);
}
