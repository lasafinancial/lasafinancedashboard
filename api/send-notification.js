// API endpoint to send push notifications via Firebase Cloud Messaging
// This uses Firebase Admin SDK to send notifications to subscribed devices

import admin from 'firebase-admin';

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  // For Vercel, use environment variables
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : null;

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // Fallback for development without service account
    admin.initializeApp({
      projectId: 'lasa-dashboard-2f21d',
    });
  }
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
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          requireInteraction: true,
        },
        fcmOptions: {
          link: '/',
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
