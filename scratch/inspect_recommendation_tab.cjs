const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

function getCredentials() {
  const keyPath = path.join(__dirname, '..', 'secerate_googlekey', 'key-partition-484615-n5-3411b9e54bd0.json');
  return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
}

async function testRecommendationRowExtraction() {
  const auth = new google.auth.GoogleAuth({
    credentials: getCredentials(),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = '1EHB65PXFold-zCt-QkMzI_nfbZTuy4hEeS9G1naXhZQ';

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'RECOMMENDATION'!A:V"
    });

    const rows = res.data.values || [];
    console.log(`Fetched ${rows.length} rows from RECOMMENDATION`);

    const result = [];
    rows.forEach((row, i) => {
      if (!row || row.length < 2) return;
      const id = (row[1] || '').toString().trim();
      if (!id || id.toUpperCase() === 'ID') return;

      const buyPrice = (row[3] || '').toString().trim();
      const targetPrice = (row[4] || '').toString().trim();
      const targetsHit = (row[5] || '').toString().trim();
      const status = (row[16] || row[2] || '').toString().trim(); // Status is in Col Q (16) or Col C (2)
      const reason = (row[19] || row[13] || '').toString().trim(); // Reason in Col T (19) or EXIT_REASON (13)
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

    console.log(`Extracted ${result.length} recommendation records.`);
    console.log("First 5 records:", result.slice(0, 5));
    console.log("Last 5 records:", result.slice(-5));

  } catch (err) {
    console.error("Error:", err.message);
  }
}

testRecommendationRowExtraction();
