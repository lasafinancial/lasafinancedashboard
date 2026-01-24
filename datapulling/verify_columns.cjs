const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.join(__dirname, 'LASA-EOD-DATA.xlsx');

const wb = XLSX.readFile(filePath, {sheets:'lasa-master'});
const sheet = wb.Sheets['lasa-master'];
const range = XLSX.utils.decode_range(sheet['!ref']);

let output = '';
output += 'Total columns: ' + (range.e.c + 1) + '\n\n';
output += 'KEY COLUMNS:\n';
output += '============\n';

const keyColumns = ['A', 'B', 'C', 'AO', 'AR', 'DH', 'DI'];
keyColumns.forEach(col => {
  const addr = col + '1';
  const cell = sheet[addr];
  output += col + ': ' + (cell ? cell.v : '(empty)') + '\n';
});

output += '\nALL COLUMNS:\n';
output += '============\n';
for(let c = 0; c <= range.e.c; c++) {
  const addr = XLSX.utils.encode_col(c) + '1';
  const cell = sheet[addr];
  output += XLSX.utils.encode_col(c) + ': ' + (cell ? cell.v : '') + '\n';
}

fs.writeFileSync(path.join(__dirname, 'columns_output.txt'), output);
console.log('Output written to columns_output.txt');
