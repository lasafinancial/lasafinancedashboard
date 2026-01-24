const { google } = require('googleapis');
const path = require('path');

const KEY_FILE = path.join(__dirname, '..', 'key-partition-484615-n5-67743fa5e288.json');

async function check() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  
  const sheets = google.sheets({ version: 'v4', auth });
  
  // Get headers from first row
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I',
    range: "'1-JAN-2026'!A1:DZ1",
  });
  
  const headers = res.data.values[0];
  
  function getColumnLetter(index) {
    let letter = '';
    let i = index;
    while (i >= 0) {
      letter = String.fromCharCode(65 + (i % 26)) + letter;
      i = Math.floor(i / 26) - 1;
    }
    return letter;
  }
  
  console.log('\n=== Headers around DJ column ===');
  // DJ is column 114 (D=3, J=9, so DJ = 3*26 + 9 = 87... actually DJ = 113)
  // A=0, B=1... Z=25, AA=26... AZ=51, BA=52... BZ=77, CA=78... CZ=103, DA=104... DJ=113
  
  for (let i = 100; i < Math.min(headers.length, 130); i++) {
    const col = getColumnLetter(i);
    console.log(`${col} (${i}): ${headers[i]}`);
  }
  
  console.log('\n=== Search for FVG or PROJ ===');
  headers.forEach((h, i) => {
    if (h && (h.toUpperCase().includes('FVG') || h.toUpperCase().includes('PROJ'))) {
      console.log(`${getColumnLetter(i)} (${i}): ${h}`);
    }
  });
}

check().catch(e => console.error('Error:', e.message));
