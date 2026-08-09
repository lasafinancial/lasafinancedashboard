const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

function getCredentials() {
  const keyPath = path.join(__dirname, '..', 'secerate_googlekey', 'key-partition-484615-n5-3411b9e54bd0.json');
  return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
}

async function testRowExtraction() {
  const auth = new google.auth.GoogleAuth({
    credentials: getCredentials(),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = '1EHB65PXFold-zCt-QkMzI_nfbZTuy4hEeS9G1naXhZQ';

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'DAILY_SECTOR_STOCK_ANALYSIS'!A:Z"
    });

    const rows = res.data.values || [];
    console.log(`Fetched ${rows.length} rows`);

    const result = [];
    rows.forEach((row, i) => {
      if (!row || row.length < 2) return;
      const id = (row[1] || '').toString().trim();
      if (!id) return;
      if (
        id.toUpperCase() === 'ID' ||
        id.toUpperCase() === 'RANK' ||
        id.startsWith('──') ||
        id.toUpperCase() === 'WATCH NEXT' ||
        id.toUpperCase() === 'MARKET REGIME' ||
        id.toUpperCase() === 'DISCLAIMER' ||
        id.toUpperCase() === 'TRAJECTORY OVERALL NOTE'
      ) {
        return;
      }

      const buyPrice = (row[3] || '').toString().trim();
      const targetPrice = (row[4] || '').toString().trim();
      const targetsHit = (row[5] || '').toString().trim();
      const status = (row[16] || '').toString().trim();
      const reason = (row[19] || '').toString().trim();
      const exitDate = (row[20] || '').toString().trim();
      const stoploss = (row[21] || '').toString().trim();

      result.push({
        rowIndex: i + 1,
        id,
        buyPrice,
        targetPrice,
        targetsHit,
        status,
        reason,
        exitDate,
        stoploss
      });
    });

    console.log(`Extracted ${result.length} stock/screener records.`);
    console.log("First 10 records:", result.slice(0, 10));
    console.log("Last 10 records:", result.slice(-10));

  } catch (err) {
    console.error("Error:", err.message);
  }
}

testRowExtraction();
