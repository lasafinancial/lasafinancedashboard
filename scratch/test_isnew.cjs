const fs = require('fs');

const intradayBreakoutScanner = [
  { symbol: 'HINDCOPPER', date: '01-Jul-2026' },
  { symbol: 'ZENSARTECH', date: '08-Jul-2026' },
  { symbol: 'BSOFT', date: '01-May-2026' } // > 30 days ago
];

const sym = 'BSOFT';
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
thirtyDaysAgo.setHours(0,0,0,0);

const today = new Date();
today.setHours(0,0,0,0);

const historicalAppearances = intradayBreakoutScanner.filter(s => {
  if (s.symbol.toUpperCase() !== sym) return false;
  let d = new Date(s.date);
  if (isNaN(d.getTime())) {
      const parts = (s.date||'').trim().split('-');
      if (parts.length === 3) {
          const months = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
          const m = months[parts[1].toLowerCase().substring(0,3)];
          if (m !== undefined) {
              let y = parseInt(parts[2], 10);
              if (y < 100) y += 2000;
              d = new Date(y, m, parseInt(parts[0], 10));
          }
      }
  }
  if (isNaN(d.getTime())) return false;
  console.log(`Parsed date for ${s.symbol}:`, d);
  console.log(`today:`, today, `thirtyDaysAgo:`, thirtyDaysAgo);
  return d < today && d >= thirtyDaysAgo;
});
console.log('Historical appearances for', sym, historicalAppearances);
const isNew = historicalAppearances.length === 0;
console.log('isNew:', isNew);
