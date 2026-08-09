const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

function getCredentials() {
  const keyPath = path.join(__dirname, '..', 'secerate_googlekey', 'key-partition-484615-n5-3411b9e54bd0.json');
  return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
}

async function verifyExitTargetScreenerFetch() {
  const auth = new google.auth.GoogleAuth({
    credentials: getCredentials(),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = '1EHB65PXFold-zCt-QkMzI_nfbZTuy4hEeS9G1naXhZQ';

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'DAILY_SECTOR_STOCK_ANALYSIS'!A:V"
    });

    const exitRows = res.data.values || [];
    console.log(`Fetched ${exitRows.length} rows from DAILY_SECTOR_STOCK_ANALYSIS`);

    const exitTargetScreener = [];
    for (let i = 0; i < exitRows.length; i++) {
      const row = exitRows[i];
      if (!row || row.length < 2) continue;
      const rawId = (row[1] || '').toString().trim();
      if (!rawId) continue;
      const upperId = rawId.toUpperCase();
      if (
        upperId === 'ID' ||
        upperId === 'RANK' ||
        rawId.startsWith('──') ||
        upperId.includes('SECTOR RANKING') ||
        upperId.includes('TOP STOCKS') ||
        upperId.includes('TRAJECTORY QUALIFICATION') ||
        upperId.includes('PATTERNS') ||
        upperId.includes('CAUTIONS') ||
        upperId === 'WATCH NEXT' ||
        upperId === 'MARKET REGIME' ||
        upperId === 'DISCLAIMER' ||
        upperId === 'TRAJECTORY OVERALL NOTE'
      ) {
        continue;
      }

      exitTargetScreener.push({
        id: rawId,
        buyPrice: row[3] !== undefined && row[3] !== null ? row[3].toString().trim() : '',
        targetPrice: row[4] !== undefined && row[4] !== null ? row[4].toString().trim() : '',
        targetsHit: row[5] !== undefined && row[5] !== null ? row[5].toString().trim() : '',
        status: row[16] !== undefined && row[16] !== null ? row[16].toString().trim() : '',
        reason: row[19] !== undefined && row[19] !== null ? row[19].toString().trim() : '',
        exitDate: row[20] !== undefined && row[20] !== null ? row[20].toString().trim() : '',
        stoploss: row[21] !== undefined && row[21] !== null ? row[21].toString().trim() : ''
      });
    }

    console.log(`Successfully mapped ${exitTargetScreener.length} exit target records.`);
    console.log("Sample mapped record [0]:", exitTargetScreener[0]);
    console.log("Sample mapped record [100]:", exitTargetScreener[100] || exitTargetScreener[exitTargetScreener.length - 1]);
  } catch (err) {
    console.error("Error in verification:", err.message);
  }
}

verifyExitTargetScreenerFetch();
