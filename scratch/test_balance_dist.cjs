const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) return;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  });
}

if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
  const keyPath = path.join(__dirname, '..', 'secerate_googlekey', 'key-partition-484615-n5-3411b9e54bd0.json');
  if (fs.existsSync(keyPath)) {
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = fs.readFileSync(keyPath, 'utf8');
  }
}

async function testBalanceDistribution() {
  const { default: handler } = await import('../api/fetch-data.js');
  let jsonOutput = null;
  const mockReq = { method: 'GET', query: {} };
  const mockRes = {
    setHeader: () => {},
    status: () => mockRes,
    json: (data) => { jsonOutput = data; return mockRes; },
    send: () => {}
  };

  await handler(mockReq, mockRes);
  if (!jsonOutput) return;

  const stocks = jsonOutput.stockData || [];
  let withBalance = 0;
  let withZeroBalance = 0;

  const accStocks = stocks.filter(s => {
    const isYes = String(s.fr || '').toUpperCase() === 'YES';
    const isAcc = String(s.obvSignal || '').toUpperCase() === 'ACCUMULATION' || String(s.obvSignal || '').toUpperCase() === 'BULLISH';
    return isYes && isAcc;
  });

  console.log(`Total OBV Accumulation stocks: ${accStocks.length}`);

  accStocks.forEach(s => {
    const history = s.history || [];
    const latest = history[history.length - 1];
    const balance = latest?.projFvg;
    if (balance && balance > 0) {
      withBalance++;
    } else {
      withZeroBalance++;
    }
  });

  console.log(`Accumulation stocks with valid Balance (> 0): ${withBalance}`);
  console.log(`Accumulation stocks without Balance (0 or missing): ${withZeroBalance}`);

  if (withBalance > 0) {
    console.log('\nSample Accumulation stocks WITH Balance:');
    const samples = accStocks.filter(s => {
      const history = s.history || [];
      const latest = history[history.length - 1];
      return latest?.projFvg && latest.projFvg > 0;
    }).slice(0, 5);

    console.table(samples.map(s => ({
      symbol: s.symbol,
      price: s.price,
      balance: s.history[s.history.length - 1].projFvg,
      obvSignal: s.obvSignal
    })));
  }
}

testBalanceDistribution().catch(console.error);
