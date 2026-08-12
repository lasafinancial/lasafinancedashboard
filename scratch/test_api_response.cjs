const fs = require('fs');
const path = require('path');

const keyPath = path.join(__dirname, '..', 'secerate_googlekey', 'key-partition-484615-n5-3411b9e54bd0.json');
if (fs.existsSync(keyPath)) {
  process.env.GOOGLE_SERVICE_ACCOUNT_KEY = fs.readFileSync(keyPath, 'utf8');
}

async function testVercelEndpoint() {
  const handlerModule = await import('../api/fetch-data.js');
  const handler = handlerModule.default;

  const req = { query: {} };
  let responseData = null;
  const res = {
    setHeader: () => {},
    status: (code) => res,
    json: (data) => {
      responseData = data;
    }
  };

  await handler(req, res);

  console.log("=== API /api/fetch-data TEST ===");
  if (!responseData) {
    console.error("No response data!");
    return;
  }

  const { playbackSnapshots, intradayDev } = responseData;
  console.log(`intradayDev length: ${intradayDev ? intradayDev.length : 0}`);
  console.log(`playbackSnapshots length: ${playbackSnapshots ? playbackSnapshots.length : 0}`);

  if (playbackSnapshots && playbackSnapshots.length > 0) {
    const lastSnap = playbackSnapshots[playbackSnapshots.length - 1];
    console.log(`Last snapshot time: ${lastSnap.time}`);
    console.log(`Last snapshot total stocks: ${lastSnap.stocks.length}`);

    const filtered = lastSnap.stocks.filter(s => {
      const price = typeof (s.close ?? s.price) === 'number' ? (s.close ?? s.price) : parseFloat(s.close ?? s.price);
      const resistance = typeof s.resistance === 'number' ? s.resistance : parseFloat(s.resistance);
      return !isNaN(price) && !isNaN(resistance) && resistance > 0 && price > resistance;
    });

    console.log(`Last snapshot stocks passing price > resistance > 0: ${filtered.length}`);
    console.log(`Sample passing symbols:`, filtered.slice(0, 10).map(s => `${s.symbol} (P:${s.close}, R:${s.resistance})`).join(', '));
  } else {
    console.error("playbackSnapshots is empty or undefined!");
  }
}

testVercelEndpoint().catch(console.error);
