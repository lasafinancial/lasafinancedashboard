// API endpoint to send push notifications via Firebase Cloud Messaging
// This uses Firebase Admin SDK to send notifications to subscribed devices

import admin from 'firebase-admin';

function getFirebaseCredentials() {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
  if (!key && !base64Key) return null;
  try {
    let credentials;
    if (base64Key) {
      const decoded = Buffer.from(base64Key, 'base64').toString('utf-8');
      credentials = JSON.parse(decoded);
    } else {
      let cleanKey = key.trim();
      if ((cleanKey.startsWith("'") && cleanKey.endsWith("'")) || (cleanKey.startsWith('"') && cleanKey.endsWith('"'))) {
        cleanKey = cleanKey.slice(1, -1).trim();
      }
      credentials = JSON.parse(cleanKey);
    }
    if (credentials?.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n').trim();
    }
    return credentials;
  } catch (e) {
    console.error('Firebase Auth Parse Error:', e.message);
    return null;
  }
}

if (!admin.apps.length) {
  const serviceAccount = getFirebaseCredentials();
  admin.initializeApp({
    credential: serviceAccount ? admin.credential.cert(serviceAccount) : admin.credential.applicationDefault(),
    projectId: 'lasa-dashboard-2f21d',
  });
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, title, body, data } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'FCM token is required' });
    }

    const message = {
      token,
      notification: {
        title: title || 'LASA Dashboard',
        body: body || 'You have a new notification',
      },
      data: data || {},
      webpush: {
        notification: {
          icon: '/complogo.png',                    // Company logo
          badge: '/complogo.png',                   // Company logo
          image: data?.image || '/testingnoti.png', // Banner image (default to test image)
          requireInteraction: true,
        },
        fcmOptions: {
          link: data?.url || '/',
        },
      },
    };

    const response = await admin.messaging().send(message);

    return res.status(200).json({
      success: true,
      messageId: response,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending notification:', error);

    // Handle specific FCM errors
    if (error.code === 'messaging/registration-token-not-registered') {
      return res.status(400).json({
        error: 'Token is no longer valid. User may have unsubscribed.'
      });
    }

    return res.status(500).json({
      error: 'Failed to send notification',
      message: error.message
    });
  }
}
