const XLSX = require('xlsx');
const path = require('path');

const wb = XLSX.readFile(path.join(__dirname, 'LASA-EOD-DATA.xlsx'), { sheets: 'lasa-master', sheetRows: 3 });
const ws = wb.Sheets['lasa-master'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
const headers = data[0];
const row1 = data[1];

function getColLetter(i) {
  let l = '';
  while (i >= 0) {
    l = String.fromCharCode(65 + (i % 26)) + l;
    i = Math.floor(i / 26) - 1;
  }
  return l;
}

const cols = ['AO', 'AR', 'DJ', 'DH', 'DI'];
console.log('=== Balance Point Columns ===');
cols.forEach(c => {
  const idx = headers.findIndex((_, i) => getColLetter(i) === c);
  console.log(`${c}: ${headers[idx]} = ${row1[idx]}`);
});
