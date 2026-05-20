const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'src', 'data', 'processed', 'stock_data.json');
const stockData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const sail = stockData.find(s => s.symbol === 'Steel Authority of India Limited' || s.name === 'Steel Authority of India Limited');
if (!sail) {
  console.log("SAIL not found!");
  process.exit(1);
}

console.log("SAIL data length:", sail.history.length);

// Let's implement the memo logic to compute activeProjFvg
let lastSeenProjFvg = null;
let activeProjFvg = null;
let previousPrice = null;

const calculated = sail.history.map((d, i) => {
  const { wolfeD: rawWolfe, projFvg: rawProjFvg } = d;
  
  if (rawProjFvg && rawProjFvg !== 0 && rawProjFvg !== lastSeenProjFvg) {
    activeProjFvg = rawProjFvg;
    lastSeenProjFvg = rawProjFvg;
  }

  let currentProjFvg = activeProjFvg;
  let event = null;
  if (activeProjFvg !== null) {
    const price = d.price;
    if (price != null) {
      const target = activeProjFvg;
      const withinRange = price >= target * 0.99 && price <= target * 1.01;
      
      let crossed = false;
      if (previousPrice != null) {
         if (previousPrice < target && price > target) crossed = true;
         if (previousPrice > target && price < target) crossed = true;
      }

      if (withinRange || crossed) {
        event = withinRange ? `within-1% (price=${price}, target=${target})` : `crossed (prev=${previousPrice}, price=${price}, target=${target})`;
        activeProjFvg = null;
        currentProjFvg = null;
      }
    }
  }
  
  if (d.price != null) {
    previousPrice = d.price;
  }

  return {
    date: d.date,
    price: d.price,
    rawProjFvg: rawProjFvg,
    activeProjFvg: activeProjFvg,
    currentProjFvg: currentProjFvg,
    event
  };
});

fs.writeFileSync('sail_debug_calculated.json', JSON.stringify(calculated, null, 2));
console.log("Wrote sail_debug_calculated.json");
