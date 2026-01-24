const XLSX = require('xlsx');
const path = require('path');

const wb = XLSX.readFile(path.join(__dirname, 'LASA-EOD-DATA.xlsx'), { sheets: 'lasa-master', sheetRows: 2 });
const ws = wb.Sheets['lasa-master'];
const headers = XLSX.utils.sheet_to_json(ws, { header: 1 })[0];

// Get column letter for index
function getColumnLetter(index) {
  let letter = '';
  while (index >= 0) {
    letter = String.fromCharCode(65 + (index % 26)) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
}

console.log('\n=== All Headers with Column Letters ===');
headers.forEach((h, i) => {
  const col = getColumnLetter(i);
  console.log(`${col}: ${h}`);
});

// Specifically check columns DH and DI
const dhIndex = headers.findIndex((_, i) => getColumnLetter(i) === 'DH');
const diIndex = headers.findIndex((_, i) => getColumnLetter(i) === 'DI');

console.log('\n=== Columns DH and DI ===');
console.log(`DH (${dhIndex}): ${headers[dhIndex]}`);
console.log(`DI (${diIndex}): ${headers[diIndex]}`);
