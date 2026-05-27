const fs = require('fs');
const file = 'api/fetch-data.js';
let content = fs.readFileSync(file, 'utf8');

// Chunk 1
content = content.replace(
  /      \.\.\.sentiment\r?\n    \};\r?\n  \}\);/g,
  `      ...sentiment\n    };\n  }).filter(t => !(t.bullish === 0 && t.bearish === 0));`
);

// Chunk 2
content = content.replace(
  /      \/\/ Add current live point to trend\r?\n      const liveDate = formatDate\(new Date\(\)\);\r?\n      marketMood\.trend\.push\(\{\r?\n        date: \`Live \(\$\{liveDate\}\)\`,\r?\n        \.\.\.sentiment\r?\n      \}\);/g,
  `      // Add current live point to trend\n      const liveDate = formatDate(new Date());\n      marketMood.trend = marketMood.trend.filter(t => t.date !== liveDate);\n      marketMood.trend.push({\n        date: \`Live (\${liveDate})\`,\n        ...sentiment\n      });`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Replacements done!');
