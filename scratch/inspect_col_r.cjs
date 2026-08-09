const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

function getCredentials() {
  const keyPath = path.join(__dirname, '..', 'secerate_googlekey', 'key-partition-484615-n5-3411b9e54bd0.json');
  return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
}

async function inspectColumnR() {
  const auth = new google.auth.GoogleAuth({
    credentials: getCredentials(),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = '1EHB65PXFold-zCt-QkMzI_nfbZTuy4hEeS9G1naXhZQ';

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'RECOMMENDATION'!A1:Z20"
    });

    const rows = res.data.values || [];
    console.log("Header/Row 0:");
    rows[0].forEach((col, idx) => {
      const colLetter = String.fromCharCode(65 + idx);
      console.log(`Col ${colLetter} (index ${idx}): ${col}`);
    });

    console.log("\nSample Rows (Col R / index 17):");
    for (let i = 1; i < Math.min(rows.length, 10); i++) {
      console.log(`Row ${i} (${rows[i][1]}): Col R = "${rows[i][17]}"`);
    }

  } catch (err) {
    console.error("Error inspecting Column R:", err.message);
  }
}

inspectColumnR();
