const http = require('http');

http.get('http://localhost:3000/api/fetch-data', (resp) => {
  let data = '';
  resp.on('data', (chunk) => {
    data += chunk;
  });
  resp.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log(JSON.stringify(result.marketMood.trend, null, 2));
    } catch (e) {
      console.log("Error parsing JSON:", e.message);
    }
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
