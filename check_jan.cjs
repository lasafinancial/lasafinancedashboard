const XLSX = require('xlsx');
const EOD_FILE = './datapulling/LASA-EOD-DATA.xlsx';

// Check 1-JAN-2026 sheet
const wb = XLSX.readFile(EOD_FILE, { sheets: '1-JAN-2026' });
const sheet = wb.Sheets['1-JAN-2026'];
const rows = XLSX.utils.sheet_to_json(sheet);

console.log('1-JAN-2026 sheet has', rows.length, 'rows');
console.log('Sample:', JSON.stringify(rows[0], null, 2));
const nifty = rows.find(r => r['STOCK_NAME'] === 'NIFTY 50');
console.log('NIFTY 50:', nifty);
