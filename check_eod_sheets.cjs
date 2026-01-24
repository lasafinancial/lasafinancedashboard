const XLSX = require('xlsx');
const eodWb = XLSX.readFile('./datapulling/LASA-EOD-DATA.xlsx', { bookSheets: true });
const dateSheets = eodWb.SheetNames.filter(name => /^\d+-[A-Z]+-\d+$/i.test(name));

const parseSheetDate = (name) => {
  const p = name.split('-');
  const months = { 'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5, 'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11 };
  return new Date(parseInt('20' + (p[2].length === 2 ? p[2] : p[2])), months[p[1].toUpperCase()], parseInt(p[0]));
};

const sorted = dateSheets.sort((a, b) => parseSheetDate(a) - parseSheetDate(b));
console.log('Total date sheets:', sorted.length);
console.log('First 5:', sorted.slice(0, 5));
console.log('Last 10:', sorted.slice(-10));

// Check for January 2026 sheets
const jan2026 = sorted.filter(s => s.includes('JAN-2026') || s.includes('JAN-26'));
console.log('\nJanuary 2026 sheets:', jan2026);
