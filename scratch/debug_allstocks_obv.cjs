const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';
const ALLSTOCKS_SHEET_ID = '1uibGhhv6Zdil2aWk17fcq1U-csYUffBdQv3Relrgfog';

function colToIdx(col) {
  let idx = 0;
  for (let i = 0; i < col.length; i++) {
    idx = idx * 26 + (col.toUpperCase().charCodeAt(i) - 64);
  }
  return idx - 1;
}

function idxToCol(idx) {
  let col = '';
  let temp = idx + 1;
  while (temp > 0) {
    let rem = (temp - 1) % 26;
    col = String.fromCharCode(65 + rem) + col;
    temp = Math.floor((temp - 1) / 26);
  }
  return col;
}

function getCredentials() {
  const keyPath = path.join(__dirname, '..', 'secerate_googlekey', 'key-partition-484615-n5-3411b9e54bd0.json');
  if (fs.existsSync(keyPath)) {
    return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  }
  const files = fs.readdirSync(path.join(__dirname, '..')).filter(f => f.endsWith('.json') && f.includes('key'));
  if (files.length > 0) {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '..', files[0]), 'utf8'));
  }
  throw new Error('Key file not found');
}

async function inspectSheet(sheets, spreadsheetId, name) {
  console.log(`\n=================== ${name} (${spreadsheetId}) ===================`);
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    console.log('Tabs:');
    meta.data.sheets.forEach(s => console.log(` - "${s.properties.title}"`));

    for (const s of meta.data.sheets) {
      const title = s.properties.title;
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${title}'!A1:ZZ`
      });
      const rows = res.data.values || [];
      console.log(`\nTab "${title}": ${rows.length} rows`);
      if (rows.length > 0) {
        const headers = rows[0].map(h => (h || '').toString().trim().toUpperCase());
        console.log(`Headers count: ${headers.length}`);
        
        headers.forEach((h, idx) => {
          if (h.includes('OBV') || h === 'FR' || h.includes('SIGNAL') || h.includes('ACCUM') || h === 'SYMBOL' || h === 'ID') {
            console.log(`   idx ${idx} (Col ${idxToCol(idx)}): "${h}"`);
          }
        });

        // Sample data for row 1-5 for OBV and FR
        const obvIdx = headers.findIndex(h => h === 'OBV_SIGNAL' || h === 'OBV SIGNAL' || h === 'OBV');
        const frIdx = headers.findIndex(h => h === 'FR' || h === 'OBV_DAILY');
        const foIdx = colToIdx('FO');
        const frColIdx = colToIdx('FR');

        console.log(`\nCol FO (idx ${foIdx}): header="${headers[foIdx] || ''}"`);
        console.log(`Col FR (idx ${frColIdx}): header="${headers[frColIdx] || ''}"`);
        
        let foCount = 0, frCount = 0;
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][foIdx] && rows[i][foIdx].toString().trim()) foCount++;
          if (rows[i][frColIdx] && rows[i][frColIdx].toString().trim()) frCount++;
        }
        console.log(`Rows with non-empty Col FO: ${foCount}`);
        console.log(`Rows with non-empty Col FR: ${frCount}`);

        if (rows.length > 1) {
          console.log('Sample rows:');
          for (let i = 1; i <= Math.min(5, rows.length - 1); i++) {
            const r = rows[i];
            console.log(` Row ${i} [${r[colToIdx('C')] || r[0]}]: FO="${r[foIdx] || ''}", FR="${r[frColIdx] || ''}", obvIdx(${obvIdx})="${r[obvIdx] || ''}", frIdx(${frIdx})="${r[frIdx] || ''}"`);
          }
        }
      }
    }
  } catch (e) {
    console.error(`Failed to inspect ${name}:`, e.message);
  }
}

async function main() {
  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  await inspectSheet(sheets, ALLSTOCKS_SHEET_ID, 'ALLSTOCKS_SHEET_ID');
  await inspectSheet(sheets, EOD_SHEET_ID, 'EOD_SHEET_ID');
}

main().catch(console.error);
