const XLSX = require('xlsx');

// Convert Excel serial date to JS Date
function excelDateToJS(serial) {
  const utc_days  = Math.floor(serial - 25569);
  return new Date(utc_days * 86400 * 1000);
}

console.log('45660 =', excelDateToJS(45660).toDateString());
console.log('46030 =', excelDateToJS(46030).toDateString());
