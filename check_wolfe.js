import d from './src/data/processed/stock_data.json' with { type: 'json' };

let found = [];
d.forEach(s => {
  if (s.history) {
    s.history.forEach(h => {
      if (h.projFvg && h.projFvg !== 0) {
        found.push({ sym: s.symbol, date: h.date, projFvg: h.projFvg });
      }
    });
  }
});

console.log('Non-zero projFvg count:', found.length);
console.log(found.slice(0, 20));
