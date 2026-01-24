const XLSX = require('xlsx');
const path = require('path');

const SWING_FILE = path.join(__dirname, 'datapulling', 'swing_backtest_2025.xlsx');

// Check DATA sheet
const dataSheet = XLSX.readFile(SWING_FILE, { sheets: 'DATA' }).Sheets['DATA'];
const rows = XLSX.utils.sheet_to_json(dataSheet);
console.log('DATA sheet row count:', rows.length);
console.log('Column keys:', Object.keys(rows[0] || {}));
console.log('\nFirst 2 rows:');
rows.slice(0, 2).forEach(r => console.log(r));

// Check dates
const dates = rows.map(r => r['DATE']).filter(Boolean);
const uniqueDates = [...new Set(dates)].sort();
console.log('\nUnique dates in DATA:', uniqueDates.length);
console.log('Date range:', uniqueDates[0], 'to', uniqueDates[uniqueDates.length-1]);

// Check a September date sheet
const sepSheet = XLSX.readFile(SWING_FILE, { sheets: 'SEP-15-2025' }).Sheets['SEP-15-2025'];
const sepRows = XLSX.utils.sheet_to_json(sepSheet);
console.log('\nSEP-15-2025 sheet row count:', sepRows.length);
if (sepRows[0]) console.log('Sep columns:', Object.keys(sepRows[0]));
