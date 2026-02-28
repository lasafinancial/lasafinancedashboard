// API endpoint to send push notifications via Firebase Cloud Messaging
// This uses Firebase Admin SDK to send notifications to subscribed devices

import admin from 'firebase-admin';

// Initialize Firebase Admin (only once)
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    let keyStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
    if ((keyStr.startsWith("'") && keyStr.endsWith("'")) || (keyStr.startsWith('"') && keyStr.endsWith('"'))) {
      keyStr = keyStr.slice(1, -1);
    }
    const serviceAccount = JSON.parse(keyStr);

    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (e) {
    console.error('[send-notification] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', e.message);
    admin.initializeApp({
      projectId: 'lasa-dashboard-2f21d',
    });
  }
} else {
  admin.initializeApp({
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
