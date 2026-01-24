const data = require('./src/data/processed/market_strength.json');
console.log('Total entries:', data.length);
console.log('First 3:', data.slice(0, 3));
console.log('Last 5:', data.slice(-5));
