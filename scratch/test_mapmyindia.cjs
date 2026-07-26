const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length > 0) {
    env[key.trim()] = val.join('=').trim().replace(/^"/, '').replace(/"$/, '');
  }
});

const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

function getCredentials() {
  const privateKey = (env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, '\n');
  if (!privateKey) {
    // Try GOOGLE_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_KEY
    const saKey = env.FIREBASE_SERVICE_ACCOUNT_KEY || env.GOOGLE_CREDENTIALS || '';
    if (saKey) {
      try {
        const creds = JSON.parse(saKey);
        if (creds.private_key) creds.private_key = creds.private_key.replace(/\\n/g, '\n');
        return creds;
      } catch (e) {
        console.error("Failed to parse service account key:", e.message);
      }
    }
    console.error("No credentials found");
    process.exit(1);
  }
  return {
    client_email: env.FIREBASE_CLIENT_EMAIL,
    private_key: privateKey,
  };
}

function colToIdx(col) {
  let idx = 0;
  for (let i = 0; i < col.length; i++) {
    idx = idx * 26 + (col.toUpperCase().charCodeAt(i) - 64);
  }
  return idx - 1;
}

async function test() {
  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  console.log("=== Fetching 'allstocks' tab ===");
  const allstocksRes = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: "'allstocks'!A1:FZ",
  });
  const allstocksRows = allstocksRes.data.values || [];
  console.log(`allstocks: ${allstocksRows.length} rows, ${allstocksRows[0] ? allstocksRows[0].length : 0} cols`);

  // Print headers around column FK (index 166)
  const fkIdx = colToIdx('FK');
  const aoIdx = colToIdx('AO');
  console.log(`\nFK column index: ${fkIdx}, AO column index: ${aoIdx}`);
  console.log(`\nHeaders near FK: `);
  if (allstocksRows[0]) {
    for (let i = Math.max(0, fkIdx - 3); i <= Math.min(allstocksRows[0].length - 1, fkIdx + 3); i++) {
      console.log(`  Col idx ${i}: "${allstocksRows[0][i]}"`);
    }
  }

  // Find MAPMYINDIA in allstocks
  const headers = allstocksRows[0] || [];
  let idIdx = headers.indexOf('SYMBOL');
  if (idIdx === -1) idIdx = headers.indexOf('ID');
  if (idIdx === -1) idIdx = colToIdx('C');
  console.log(`\nID column index: ${idIdx}, header: "${headers[idIdx]}"`);

  // Search all columns for MAPMYINDIA
  let found = false;
  for (let i = 1; i < allstocksRows.length; i++) {
    const row = allstocksRows[i];
    // Check multiple columns for MAPMYINDIA
    const idVal = (row[idIdx] || '').toString().trim().toUpperCase();
    const colC = (row[colToIdx('C')] || '').toString().trim().toUpperCase();
    const colA = (row[colToIdx('A')] || '').toString().trim().toUpperCase();
    
    if (idVal === 'MAPMYINDIA' || colC === 'MAPMYINDIA' || colA === 'MAPMYINDIA') {
      found = true;
      console.log(`\n=== MAPMYINDIA found in allstocks at row ${i} ===`);
      console.log(`  ID col (${idIdx}): "${row[idIdx]}"`);
      console.log(`  Col A (0): "${row[0]}"`);
      console.log(`  Col C (${colToIdx('C')}): "${row[colToIdx('C')]}"`);
      console.log(`  Col AO (${aoIdx}): "${row[aoIdx]}"`);
      console.log(`  Col FK (${fkIdx}): "${row[fkIdx]}"`);
      console.log(`  Col EQ (${colToIdx('EQ')}): "${row[colToIdx('EQ')]}"`);
      console.log(`  Row length: ${row.length}`);
      if (row.length <= fkIdx) {
        console.log(`  *** ROW IS TOO SHORT TO REACH FK! Row has ${row.length} cols, FK needs index ${fkIdx} ***`);
      }
      break;
    }
  }
  if (!found) {
    console.log("\nMAPMYINDIA NOT FOUND in allstocks by exact match. Searching partial...");
    for (let i = 1; i < Math.min(allstocksRows.length, 2000); i++) {
      const row = allstocksRows[i];
      for (let j = 0; j < Math.min(row.length, 10); j++) {
        if ((row[j] || '').toString().toUpperCase().includes('MAPMYINDIA')) {
          console.log(`  Found partial match at row ${i}, col ${j}: "${row[j]}"`);
        }
      }
    }
  }

  // Also check 'current' tab for comparison
  console.log("\n=== Fetching 'current' tab ===");
  const currentRes = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: "'current'!A1:FZ",
  });
  const currentRows = currentRes.data.values || [];
  console.log(`current: ${currentRows.length} rows, ${currentRows[0] ? currentRows[0].length : 0} cols`);

  // Check if ML_TARGET_PERCENT header exists
  const currentHeaders = currentRows[0] || [];
  const mlTargetIdx = currentHeaders.indexOf('ML_TARGET_PERCENT');
  console.log(`\nML_TARGET_PERCENT header index in current: ${mlTargetIdx}`);
  console.log(`Current tab header at FK (${fkIdx}): "${currentHeaders[fkIdx]}"`);

  // Find MAPMYINDIA in current
  for (let i = 1; i < currentRows.length; i++) {
    const row = currentRows[i];
    const idVal = (row[colToIdx('C')] || '').toString().trim().toUpperCase();
    if (idVal === 'MAPMYINDIA') {
      console.log(`\n=== MAPMYINDIA found in current at row ${i} ===`);
      console.log(`  Col C (${colToIdx('C')}): "${row[colToIdx('C')]}"`);
      console.log(`  Col FK (${fkIdx}): "${row[fkIdx]}"`);
      if (mlTargetIdx > -1) console.log(`  ML_TARGET_PERCENT (${mlTargetIdx}): "${row[mlTargetIdx]}"`);
      console.log(`  Col EQ (${colToIdx('EQ')}): "${row[colToIdx('EQ')]}"`);
      console.log(`  Row length: ${row.length}`);
      if (row.length <= fkIdx) {
        console.log(`  *** ROW IS TOO SHORT TO REACH FK! Row has ${row.length} cols, FK needs index ${fkIdx} ***`);
      }
      break;
    }
  }
}

test().catch(console.error);
