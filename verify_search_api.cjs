const http = require('http');

http.get('http://localhost:3001/api/fetch-data', (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('--- API Verification ---');
            const stocks = json.stockData || [];
            console.log('Total stocks found:', stocks.length);

            const tcs = stocks.find(s => s.symbol === 'TCS');
            if (tcs) {
                console.log('Found ID: TCS');
                console.log('Full Name:', tcs.name);
            } else {
                console.log('TCS not found in keys. Sample stock:');
                console.log(JSON.stringify(stocks[0], (key, value) => key === 'history' ? undefined : value, 2));
            }
        } catch (e) {
            console.error('Error parsing JSON:', e.message);
        }
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
