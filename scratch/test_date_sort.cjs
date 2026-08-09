function parseDateValue(dateStr) {
  if (!dateStr || !dateStr.trim()) return 0;
  const str = dateStr.trim();
  const parsed = Date.parse(str);
  if (!isNaN(parsed) && parsed > 0) return parsed;

  const parts = str.split(/[-/]/);
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
      return new Date(y < 100 ? 2000 + y : y, m, d).getTime();
    }
  }
  return 0;
}

const testDates = ['01-Jul-2026', '07-Aug-2026', '20-Jul-2026', '03-Aug-2026', '', '—'];
testDates.sort((a, b) => parseDateValue(b) - parseDateValue(a));
console.log("Sorted dates descending:", testDates);
