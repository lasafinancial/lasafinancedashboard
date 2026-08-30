// Firebase Messaging Service Worker
// This runs in the background and handles push notifications

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyC1H-wPpsAObnQ1onNVQDP-dwGSkgniQHY",
  authDomain: "lasa-dashboard-2f21d.firebaseapp.com",
  projectId: "lasa-dashboard-2f21d",
  storageBucket: "lasa-dashboard-2f21d.firebasestorage.app",
  messagingSenderId: "216300482922",
  appId: "1:216300482922:web:7e71e2171674dc45147513",
});

const messaging = firebase.messaging();

// Handle background messages via Firebase SDK
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const title = payload.notification?.title || payload.data?.title || 'LASA Dashboard';
  const body = payload.notification?.body || payload.data?.body || 'You have a new notification';
  const image = payload.data?.image || payload.notification?.image || '/complogo.png';

  const notificationOptions = {
    body: body,
    icon: '/complogo.png',
    badge: '/complogo.png',
    image: image,
    tag: payload.data?.tag || 'lasa-notification',
    data: payload.data || {},
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Open Dashboard' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  self.registration.showNotification(title, notificationOptions);
});

// Fallback push event handler for raw webpush frames
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('[firebase-messaging-sw.js] Raw Push event received:', payload);
      const title = payload.notification?.title || payload.data?.title || 'LASA Dashboard';
      const body = payload.notification?.body || payload.data?.body || 'You have a new notification';
      const image = payload.data?.image || payload.notification?.image || '/complogo.png';

      event.waitUntil(
        self.registration.showNotification(title, {
          body: body,
          icon: '/complogo.png',
          badge: '/complogo.png',
          image: image,
          tag: 'lasa-push-notification',
          data: payload.data || {},
          requireInteraction: true
        })
      );
    } catch (e) {
      console.error('[firebase-messaging-sw.js] Push parse error:', e);
    }
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activated');
  event.waitUntil(clients.claim());
});
