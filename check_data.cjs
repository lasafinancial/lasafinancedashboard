const j = require('./temp_data.json');
const ip = j.indexPerformance[0];
console.log('Index:', ip.name);
ip.stocks.slice(0,10).forEach(s => {
  const range = s.upperRange - s.lowerRange;
  const pos = range > 0 ? ((s.price - s.lowerRange) / range) * 100 : 50;
  console.log(s.stockName, '- Price:', s.price, 'Lower:', s.lowerRange, 'Upper:', s.upperRange, '=> Position:', pos.toFixed(1) + '%');
});
