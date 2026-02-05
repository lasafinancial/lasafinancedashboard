const http = require('http');

http.get('http://localhost:3001/api/multibagger', (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('--- API Verification ---');
            console.log('Total candidates found:', json.length);
            if (json.length > 0) {
                console.log('Sample candidate:', JSON.stringify(json[0], null, 2));
            }
        } catch (e) {
            console.error('Error parsing JSON:', e.message);
            console.log('Raw output:', data.substring(0, 500));
        }
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
