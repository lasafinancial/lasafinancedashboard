const data = require('./src/data/processed/stock_data.json');
const withTrue = data.filter(s => s.resistanceSlopeDownward === true);
console.log('Stocks with resistanceSlopeDownward=TRUE:', withTrue.length);
console.log('Sample TRUE stocks:', withTrue.slice(0, 10).map(s => s.symbol));
const withFalse = data.filter(s => s.resistanceSlopeDownward === false);
console.log('Stocks with resistanceSlopeDownward=FALSE:', withFalse.length);
