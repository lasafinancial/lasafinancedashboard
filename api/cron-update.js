export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // On Vercel use the deployment URL; when self-hosted, call this same server
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : `http://127.0.0.1:${process.env.PORT || 3000}`;

    const response = await fetch(`${baseUrl}/api/fetch-data`);

    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }

    const data = await response.json();

    console.log(`Cron job completed at ${new Date().toISOString()}`);
    console.log(`Fetched ${data.stockData?.length || 0} stocks`);

    res.status(200).json({
      success: true,
      message: 'Data refresh triggered',
      stockCount: data.stockData?.length || 0,
      lastUpdated: data.lastUpdated
    });
  } catch (error) {
    console.error('Cron job error:', error);
    res.status(500).json({ error: 'Cron job failed', message: error.message });
  }
}
