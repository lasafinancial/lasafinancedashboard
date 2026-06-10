const fs = require('fs');
let c = fs.readFileSync('api/fetch-data.js', 'utf8');
c = c.replace(
  /if \(intradayDev\.length === 0\) throw new Error\('Intraday Commentary parsed 0 valid stocks\.'\);[\s\S]*?const \[h, m\] = t\.split\(':'\)\.map\(Number\);[\s\S]*?return h \* 60 \+ m;[\s\S]*?\} catch \{ return 0; \}[\s\S]*?\};/,
  `if (intradayDev.length === 0) throw new Error('Intraday Commentary parsed 0 valid stocks.');
        const parseTime = (t) => {
          try {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
          } catch { return 0; }
        };`
);
fs.writeFileSync('api/fetch-data.js', c);
