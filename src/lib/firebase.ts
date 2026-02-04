import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { getFirestore, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Cloud Messaging
let messaging: Messaging | null = null;

// Only initialize messaging in browser environment with service worker support
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.error('Failed to initialize Firebase Messaging:', error);
  }
}

// Request notification permission and get FCM token
export async function requestNotificationPermission(): Promise<string | null> {
  if (!messaging) {
    console.error('Firebase Messaging is not initialized');
    return null;
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    
    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log('FCM Token:', token);
      // Store token in localStorage for reference
      localStorage.setItem('fcm_token', token);
      return token;
    } else {
      console.log('No registration token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
}

// Listen for foreground messages
export function onForegroundMessage(callback: (payload: any) => void): (() => void) | null {
  if (!messaging) {
    console.error('Firebase Messaging is not initialized');
    return null;
  }

  return onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });
}

// Check if notifications are enabled
export function isNotificationEnabled(): boolean {
  return Notification.permission === 'granted' && !!localStorage.getItem('fcm_token');
}

// Disable notifications (remove token from localStorage)
export function disableNotifications(): void {
  localStorage.removeItem('fcm_token');
}

// Get stored FCM token
export function getStoredToken(): string | null {
  return localStorage.getItem('fcm_token');
}

// Save FCM token to Firestore (for server-side notifications)
export async function saveTokenToFirestore(token: string): Promise<boolean> {
  try {
    const tokenRef = doc(db, 'fcm_tokens', token);
    await setDoc(tokenRef, {
      token,
      createdAt: serverTimestamp(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
    });
    console.log('Token saved to Firestore');
    return true;
  } catch (error) {
    console.error('Error saving token to Firestore:', error);
    return false;
  }
}

// Remove FCM token from Firestore
export async function removeTokenFromFirestore(token: string): Promise<boolean> {
  try {
    const tokenRef = doc(db, 'fcm_tokens', token);
    await deleteDoc(tokenRef);
    console.log('Token removed from Firestore');
    return true;
  } catch (error) {
    console.error('Error removing token from Firestore:', error);
    return false;
  }
}

export { app, messaging, db };
