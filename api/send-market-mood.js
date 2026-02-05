// API endpoint to send Market Mood notifications to all subscribed users
// Triggered by: 1) Vercel Cron (every 5 hours), 2) Manual admin button

import admin from 'firebase-admin';
import { google } from 'googleapis';

const EOD_SHEET_ID = '1zINbPMxpI4qXSFFNuOn6U_dvrSwwPAfxUe2ORPIuj2I';

function getFirebaseCredentials() {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;

  if (!key && !base64Key) return null;

  try {
    let credentials;

    // Try base64 first (more reliable for Vercel)
    if (base64Key) {
      console.log('Using Base64 encoded Firebase credentials');
      const decoded = Buffer.from(base64Key, 'base64').toString('utf-8');
      credentials = JSON.parse(decoded);
    } else {
      console.log('Using direct JSON Firebase credentials');
      // Fallback to direct JSON
      let cleanKey = key.trim();

      // Remove potential surrounding quotes from Vercel env var
      if ((cleanKey.startsWith("'") && cleanKey.endsWith("'")) ||
        (cleanKey.startsWith('"') && cleanKey.endsWith('"'))) {
        cleanKey = cleanKey.slice(1, -1).trim();
      }

      credentials = JSON.parse(cleanKey);
      if (typeof credentials === 'string') {
        credentials = JSON.parse(credentials);
      }
    }

    // Normalize private key format
    if (credentials?.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
      credentials.private_key = credentials.private_key.trim();
      if (credentials.private_key.startsWith('"') && credentials.private_key.endsWith('"')) {
        credentials.private_key = credentials.private_key.slice(1, -1).replace(/\\n/g, '\n');
      }
    }

    console.log('Firebase credentials parsed successfully');
    return credentials;
  } catch (e) {
    console.error('Failed to parse Firebase credentials:', e.message);
    console.error('Error details:', e);
    return null;
  }
}

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  const serviceAccount = getFirebaseCredentials();

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}

function getGoogleCredentials() {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const base64Key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;

  if (!key && !base64Key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 not set');
  }

  try {
    let credentials;

    // Try base64 first (more reliable for Vercel)
    if (base64Key) {
      console.log('Using Base64 encoded Google credentials');
      const decoded = Buffer.from(base64Key, 'base64').toString('utf-8');
      credentials = JSON.parse(decoded);
    } else {
      console.log('Using direct JSON Google credentials');
      let cleanKey = key.trim();

      // Remove potential surrounding quotes from Vercel env var
      if ((cleanKey.startsWith("'") && cleanKey.endsWith("'")) ||
        (cleanKey.startsWith('"') && cleanKey.endsWith('"'))) {
        cleanKey = cleanKey.slice(1, -1).trim();
      }

      credentials = JSON.parse(cleanKey);
      if (typeof credentials === 'string') {
        credentials = JSON.parse(credentials);
      }
    }

    // Normalize private key format
    if (credentials?.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
      credentials.private_key = credentials.private_key.trim();
      if (credentials.private_key.startsWith('"') && credentials.private_key.endsWith('"')) {
        credentials.private_key = credentials.private_key.slice(1, -1).replace(/\\n/g, '\n');
      }
    }

    console.log('Google credentials parsed successfully');
    return credentials;
  } catch (e) {
    console.error('Failed to parse Google credentials:', e.message);
    throw e;
  }
}

function getDynamicStatus(price, lowerRange, upperRange) {
  const actualMin = Math.min(price, lowerRange);
  const actualMax = Math.max(price, upperRange);
  const padding = (actualMax - actualMin) * 0.1;
  const displayMin = actualMin - padding;
  const displayMax = actualMax + padding;
  const displayRange = displayMax - displayMin;

  const pricePosition = displayRange > 0 ? ((price - displayMin) / displayRange) * 100 : 50;

  if (pricePosition > 66.66) return "BULLISH";
  if (pricePosition < 33.33) return "BEARISH";
  return "NEUTRAL";
}

async function fetchMarketMood() {
  const credentials = getGoogleCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  // Fetch current sheet data
  const currentRes = await sheets.spreadsheets.values.get({
    spreadsheetId: EOD_SHEET_ID,
    range: "'current'!A1:FJ",
  });

  const rows = currentRes.data.values;
  if (!rows || rows.length < 2) {
    throw new Error('No data found in current sheet');
  }

  // Convert rows to objects
  const headers = rows[0].map(h => (h || '').toString().trim());
  const dataRows = rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      if (header) obj[header] = row[i] !== undefined ? row[i] : null;
    });
    return obj;
  });

  // Filter to LARGECAP and MIDCAP only (first 470 rows)
  const moodStocks = dataRows.slice(0, 470).filter(row => {
    const group = (row['GROUP'] || '').toString().toUpperCase();
    return group === 'LARGECAP' || group === 'MIDCAP';
  });

  let bullCount = 0, bearCount = 0, neutCount = 0;

  moodStocks.forEach(row => {
    const closePrice = parseFloat((row['CLOSE_PRICE'] || '0').toString().replace(/,/g, '')) || 0;
    const upperRange = parseFloat((row['RESISTANCE'] || '0').toString().replace(/,/g, '')) || 0;
    const lowerRange = parseFloat((row['SUPPORT'] || '0').toString().replace(/,/g, '')) || 0;

    const status = getDynamicStatus(closePrice, lowerRange, upperRange);
    if (status === 'BULLISH') bullCount++;
    else if (status === 'BEARISH') bearCount++;
    else neutCount++;
  });

  const total = moodStocks.length;
  if (total === 0) throw new Error('No stocks found for mood calculation');

  return {
    bullish: Math.round((bullCount / total) * 100),
    bearish: Math.round((bearCount / total) * 100),
    neutral: Math.round((neutCount / total) * 100),
    total
  };
}

async function getAllFCMTokens() {
  const db = admin.firestore();
  const tokensSnapshot = await db.collection('fcm_tokens').get();

  const tokens = [];
  tokensSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.token) {
      tokens.push(data.token);
    }
  });

  return tokens;
}

async function sendNotificationToAll(tokens, title, body) {
  if (tokens.length === 0) {
    return { success: 0, failed: 0, errors: ['No tokens to send to'] };
  }

  let successCount = 0;
  let failedCount = 0;
  const errors = [];
  const invalidTokens = [];

  // Send to each token individually (FCM batch has limits)
  for (const token of tokens) {
    try {
      const message = {
        token,
        notification: { title, body },
        webpush: {
          notification: {
            icon: '/complogo.png',           // Company logo as icon
            badge: '/complogo.png',          // Company logo as badge
            image: '/testingnoti.png',       // Large banner image
            requireInteraction: true,
          },
          fcmOptions: {
            link: '/',
          },
        },
      };

      await admin.messaging().send(message);
      successCount++;
    } catch (error) {
      failedCount++;
      errors.push(`Token ${token.slice(0, 20)}...: ${error.message}`);

      // Track invalid tokens for cleanup
      if (error.code === 'messaging/registration-token-not-registered' ||
        error.code === 'messaging/invalid-registration-token') {
        invalidTokens.push(token);
      }
    }
  }

  // Clean up invalid tokens from Firestore
  if (invalidTokens.length > 0) {
    const db = admin.firestore();
    for (const token of invalidTokens) {
      try {
        await db.collection('fcm_tokens').doc(token).delete();
      } catch (e) {
        console.error('Failed to delete invalid token:', e);
      }
    }
  }

  return { success: successCount, failed: failedCount, errors, cleaned: invalidTokens.length };
}

export default async function handler(req, res) {
  // Allow both GET (for cron) and POST (for manual trigger)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Optional: Add a secret key for security
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  // Skip auth check for cron jobs (they come from Vercel) or if no secret is set
  const isVercelCron = req.headers['x-vercel-cron'] === '1';
  const isAuthorized = !cronSecret || isVercelCron || authHeader === `Bearer ${cronSecret}`;

  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 1. Fetch live market mood data
    const mood = await fetchMarketMood();

    // 2. Determine the winning mood
    let dominantMood, moodPercent;
    if (mood.bullish >= mood.bearish && mood.bullish >= mood.neutral) {
      dominantMood = 'BULLISH';
      moodPercent = mood.bullish;
    } else if (mood.bearish >= mood.bullish && mood.bearish >= mood.neutral) {
      dominantMood = 'BEARISH';
      moodPercent = mood.bearish;
    } else {
      dominantMood = 'NEUTRAL';
      moodPercent = mood.neutral;
    }

    // 3. Create notification message
    const title = 'Market Mood Update';
    const body = `Today's market is ${moodPercent}% ${dominantMood}`;

    // 4. Get all FCM tokens from Firestore
    const tokens = await getAllFCMTokens();

    // 5. Send notification to all users
    const result = await sendNotificationToAll(tokens, title, body);

    return res.status(200).json({
      success: true,
      mood: {
        bullish: mood.bullish,
        bearish: mood.bearish,
        neutral: mood.neutral,
        dominant: dominantMood,
        percent: moodPercent
      },
      notification: {
        title,
        body,
        sentTo: tokens.length,
        successCount: result.success,
        failedCount: result.failed,
        cleanedTokens: result.cleaned
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in send-market-mood:', error);
    return res.status(500).json({
      error: 'Failed to send market mood notification',
      message: error.message
    });
  }
}
