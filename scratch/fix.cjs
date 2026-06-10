const fs = require('fs');
let c = fs.readFileSync('api/fetch-data.js', 'utf8');
c = c.replace(/'current'!A1:FJ/g, "'current'!A1:FZ");
fs.writeFileSync('api/fetch-data.js', c);
console.log('Fixed fetch-data.js current fetch range');
