const { google } = require('googleapis');
const path = require('path');

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'secerate_googlekey', 'key.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
});

async function check() {
  const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1j0A4e8_UHxFDVQR1i8g1yVqbYLyuM2LKhfssTWaVGLQ',
    range: 'lasa-master!1:1'
  });
  const headers = res.data.values[0];
  console.log('Total columns:', headers.length);
  
  const statusIdx = headers.findIndex(h => h && h.toUpperCase() === 'STATUS');
  console.log('STATUS column index:', statusIdx);
  
  const indexCols = ['NIFTY50', 'NIFTYBANK', 'NIFTYFIN', 'NIFTYIT', 'NIFTYPHARMA', 'NIFTYMETAL', 'NIFTYAUTO', 'NIFTYENERGY', 'NIFTYFMCG', 'NIFTYPSU', 'NIFTYMEDIA'];
  console.log('\nIndex columns:');
  indexCols.forEach(col => {
    const idx = headers.findIndex(h => h && h.toUpperCase() === col);
    console.log(`  ${col}: ${idx >= 0 ? 'Found at index ' + idx : 'NOT FOUND'}`);
  });
  
  // Show all headers around expected positions
  console.log('\nHeaders from index 55-65 (around STATUS):');
  for (let i = 55; i <= 65 && i < headers.length; i++) {
    console.log(`  [${i}]: ${headers[i]}`);
  }
  
  console.log('\nHeaders from index 145-165 (around index columns):');
  for (let i = 145; i <= 165 && i < headers.length; i++) {
    console.log(`  [${i}]: ${headers[i]}`);
  }
}

check().catch(console.error);
