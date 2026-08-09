const http = require('http');

// Let's run a test by importing the backend function or testing handler
const handler = require('../api/fetch-data.js').default;

async function test() {
  const req = { query: { force: 'true' } };
  let responseData = null;
  const res = {
    setHeader: () => {},
    status: (code) => {
      return {
        json: (data) => {
          responseData = data;
        }
      };
    }
  };

  console.log('Calling api/fetch-data handler...');
  await handler(req, res);

  if (!responseData) {
    console.error('No response returned!');
    return;
  }

  console.log('stockData total count:', responseData.stockData ? responseData.stockData.length : 0);
  console.log('intradayBreakoutScanner count:', responseData.intradayBreakoutScanner ? responseData.intradayBreakoutScanner.length : 0);

  if (responseData.stockData) {
    let accYesCount = 0;
    const matches = [];
    responseData.stockData.forEach(s => {
      const isYes = String(s.fr || "").toUpperCase() === "YES";
      const isAcc = String(s.obvSignal || "").toUpperCase() === "ACCUMULATION" || String(s.obvSignal || "").toUpperCase() === "BULLISH";
      if (isYes && isAcc) {
        accYesCount++;
        matches.push({ symbol: s.symbol, fr: s.fr, obvSignal: s.obvSignal, price: s.price });
      }
    });
    console.log(`Matching stocks in stockData: ${accYesCount}`);
    console.log('Sample matches:', matches.slice(0, 10));
  }
}

test().catch(console.error);
