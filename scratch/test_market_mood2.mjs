import { fetchData } from '../api/fetch-data.js';

async function run() {
  const result = await fetchData();
  console.log(JSON.stringify(result.marketMood.trend, null, 2));
}

run();
