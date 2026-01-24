const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'src', 'data', 'processed', 'market_strength.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const niftyData = {
  "10th Dec": { nifty50_close: 25826.06, total_score: 6, ml_threshold: 39, momentum_oscillator: 18 },
  "11th Dec": { nifty50_close: 25821.5, total_score: 6, ml_threshold: 41, momentum_oscillator: 18 },
  "12th Dec": { nifty50_close: 26003.55, total_score: 6, ml_threshold: 21, momentum_oscillator: 30 },
  "15th Dec": { nifty50_close: 25977.31, total_score: 6, ml_threshold: 23, momentum_oscillator: 32 },
  "16th Dec": { nifty50_close: 25906.68, total_score: 6, ml_threshold: 22, momentum_oscillator: 26 },
  "17th Dec": { nifty50_close: 25855.11, total_score: 6, ml_threshold: 24, momentum_oscillator: 23 },
  "18th Dec": { nifty50_close: 25802.23, total_score: 5, ml_threshold: 24, momentum_oscillator: 22 },
  "19th Dec": { nifty50_close: 25937.93, total_score: 5, ml_threshold: 22, momentum_oscillator: 31 },
  "22nd Dec": { nifty50_close: 26114.19, total_score: 6, ml_threshold: 20, momentum_oscillator: 38 },
  "23rd Dec": { nifty50_close: 26183.74, total_score: 5, ml_threshold: 16, momentum_oscillator: 44 },
  "24th Dec": { nifty50_close: 26168.04, total_score: 5, ml_threshold: 18, momentum_oscillator: 43 },
  "26th Dec": { nifty50_close: 26079.09, total_score: 5, ml_threshold: 20, momentum_oscillator: 38 },
  "29th Dec": { nifty50_close: 26008.14, total_score: 5, ml_threshold: 22, momentum_oscillator: 33 },
  "30th Dec": { nifty50_close: 25933.63, total_score: 4, ml_threshold: 20, momentum_oscillator: 33 },
  "31st Dec": { nifty50_close: 26064.4, total_score: 5, ml_threshold: 18, momentum_oscillator: 44 },
  "1st Jan": { nifty50_close: 26157.7, total_score: 5, ml_threshold: 17, momentum_oscillator: 46 },
  "2nd Jan": { nifty50_close: 26235.51, total_score: 5, ml_threshold: 15, momentum_oscillator: 56 },
  "5th Jan": { nifty50_close: 26291.81, total_score: 5, ml_threshold: 16, momentum_oscillator: 54 },
  "6th Jan": { nifty50_close: 26191.77, total_score: 4, ml_threshold: 13, momentum_oscillator: 53 },
  "7th Jan": { nifty50_close: 26134.72, total_score: 4, ml_threshold: 15, momentum_oscillator: 52 },
  "8th Jan": { nifty50_close: 25993.75, total_score: 3, ml_threshold: 18, momentum_oscillator: 33 },
  "9th Jan": { nifty50_close: 25771.83, total_score: 4, ml_threshold: 24, momentum_oscillator: 24 },
  "12th Jan": { nifty50_close: 25686.46, total_score: 3, ml_threshold: 23, momentum_oscillator: 25 },
  "13th Jan": { nifty50_close: 25783.19, total_score: 3, ml_threshold: 22, momentum_oscillator: 24 },
  "14th Jan": { nifty50_close: 25677.46, total_score: 3, ml_threshold: 25, momentum_oscillator: 28 },
  "16th Jan": { nifty50_close: 25731.58, total_score: 4, ml_threshold: 22, momentum_oscillator: 28 },
  "19th Jan": { nifty50_close: 25596.56, total_score: 4, ml_threshold: 20, momentum_oscillator: 23 },
  "20th Jan": { nifty50_close: 25392.29, total_score: 4, ml_threshold: 17, momentum_oscillator: 13 },
  "21st Jan": { nifty50_close: 25129.81, total_score: 5, ml_threshold: 17, momentum_oscillator: 12 }
};

const updatedData = data.map(item => {
  const nifty = niftyData[item.date];
  if (nifty) {
    return {
      ...item,
      nifty50_close: nifty.nifty50_close,
      total_score: nifty.total_score,
      ml_threshold: nifty.ml_threshold,
      momentum_oscillator: nifty.momentum_oscillator
    };
  }
  return {
    ...item,
    nifty50_close: 0,
    total_score: 0,
    ml_threshold: 0,
    momentum_oscillator: item.rsi || 0
  };
});

fs.writeFileSync(jsonPath, JSON.stringify(updatedData, null, 2));
console.log('Added Nifty 50 data to', updatedData.filter(d => d.nifty50_close > 0).length, 'entries');
