const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./src/data/processed/stock_data.json', 'utf8'));
const reliance = data.find(s => s.symbol === 'RELIANCE');
if (reliance) {
  console.log('History length:', reliance.history?.length || 0);
  console.log('First date:', reliance.history?.[0]?.date);
  console.log('Last date:', reliance.history?.[reliance.history.length - 1]?.date);
} else {
  console.log('RELIANCE not found');
  console.log('Total stocks:', data.length);
  console.log('First stock history:', data[0]?.history?.length);
}
