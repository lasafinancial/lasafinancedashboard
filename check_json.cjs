const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./src/data/processed/stock_data.json', 'utf8'));
const stock = data[0];
console.log('First stock:', stock.symbol);
console.log('First history point:');
console.log(JSON.stringify(stock.history[0], null, 2));
console.log('\nLast history point:');
console.log(JSON.stringify(stock.history[stock.history.length - 1], null, 2));
