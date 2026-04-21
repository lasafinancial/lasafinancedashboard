
const http = require('http');

http.get('http://127.0.0.1:3001/api/nifty-options-data', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log(`Successfully fetched ${json.length} items from local server`);
            if (json.length > 0) {
                const first = json[0];
                const last = json[json.length - 1];
                console.log('First Record Time:', first.Time);
                console.log('Last Record Time:', last.Time);
                console.log('Last Record JSON exists:', !!last['Raw JSON Data']);
            }
        } catch (e) {
            console.error('Error parsing response:', e.message);
            console.log('Raw response (first 200 chars):', data.substring(0, 200));
        }
    });
}).on('error', err => {
    console.error('Request failed:', err.message);
});
