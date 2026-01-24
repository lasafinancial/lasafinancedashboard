const XLSX = require('xlsx');
const path = require('path');

const EOD_FILE = path.join(__dirname, 'datapulling', 'LASA-EOD-DATA.xlsx');

const eodWorkbook = XLSX.readFile(EOD_FILE, { bookSheets: true });
const dateSheets = eodWorkbook.SheetNames.filter(name => /^\d+-[A-Z]+-\d+$/i.test(name));

console.log('Total date sheets:', dateSheets.length);
console.log('First 10 sheets:', dateSheets.slice(0, 10));
console.log('Last 10 sheets:', dateSheets.slice(-10));

// Check lasa-master
const masterSheet = XLSX.readFile(EOD_FILE, { sheets: 'lasa-master' }).Sheets['lasa-master'];
const masterRows = XLSX.utils.sheet_to_json(masterSheet);

// Get unique dates
const dates = [...new Set(masterRows.map(r => r['DATE']))].sort();
console.log('\nlasa-master unique dates:', dates.length);
console.log('First 5 dates:', dates.slice(0, 5));
console.log('Last 5 dates:', dates.slice(-5));
