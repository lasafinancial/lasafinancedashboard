const sixMonthsAgo = new Date();
sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
console.log('Today:', new Date().toISOString());
console.log('Six months ago:', sixMonthsAgo.toISOString());

const testDates = ['2026-01-20', '2025-12-03', '2025-08-01', '2025-07-01'];
testDates.forEach(d => {
  const parsed = new Date(d);
  console.log(d, '-> parsed:', parsed.toISOString(), '-> isAfter6mo:', parsed >= sixMonthsAgo);
});
