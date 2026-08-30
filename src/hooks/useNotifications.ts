import { useState, useEffect, useCallback } from 'react';
import {
  requestNotificationPermission,
  onForegroundMessage,
  isNotificationEnabled,
  disableNotifications,
  getStoredToken,
  saveTokenToFirestore,
  removeTokenFromFirestore
} from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';

interface NotificationPayload {
  notification?: {
    title?: string;
    body?: string;
    image?: string;
  };
  data?: Record<string, string>;
}

export function useNotifications() {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  // Check initial state
  useEffect(() => {
    // Check if notifications are supported
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setIsSupported(false);
      return;
    }

    const isExplicitlyDisabled = localStorage.getItem('notifications_disabled') === 'true';
    if (isExplicitlyDisabled) {
      setIsEnabled(false);
      return;
    }

    // Default to ENABLED: auto-request/sync token on load
    requestNotificationPermission().then(async (fcmToken) => {
      if (fcmToken) {
        await saveTokenToFirestore(fcmToken);
        setToken(fcmToken);
        setIsEnabled(true);
      }
    }).catch(err => {
      console.warn('Auto notification setup error:', err);
    });
  }, []);

  // Set up foreground message listener unconditionally once initialized
  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload: NotificationPayload) => {
      console.log('[useNotifications] Foreground message received:', payload);
      const notifTitle = payload.notification?.title || payload.data?.title || 'LASA Dashboard';
      const notifBody = payload.notification?.body || payload.data?.body || 'New notification';
      const notifImage = payload.data?.image || payload.notification?.image || '/complogo.png';

      // 1. Show toast inside app
      toast({
        title: notifTitle,
        description: notifBody,
      });

      // 2. Safely show native notification banner
      if (typeof window !== 'undefined' && Notification.permission === 'granted') {
        const notifOptions = {
          body: notifBody,
          icon: '/complogo.png',
          badge: '/complogo.png',
          image: notifImage,
          data: payload.data,
          requireInteraction: true,
        };

        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(notifTitle, notifOptions as any);
          }).catch(() => {
            try {
              new Notification(notifTitle, notifOptions);
            } catch (e) {}
          });
        } else {
          try {
            new Notification(notifTitle, notifOptions);
          } catch (e) {}
        }
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Enable notifications
  const enableNotifications = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: 'Not Supported',
        description: 'Push notifications are not supported in this browser.',
        variant: 'destructive',
      });
      return false;
    }

    setIsLoading(true);

    try {
      localStorage.removeItem('notifications_disabled');
      const fcmToken = await requestNotificationPermission();

      if (fcmToken) {
        // Save token to Firestore for server-side notifications
        await saveTokenToFirestore(fcmToken);

        setToken(fcmToken);
        setIsEnabled(true);
        toast({
          title: 'Notifications Enabled',
          description: 'You will now receive market alerts and updates.',
        });
        return true;
      } else {
        toast({
          title: 'Permission Denied',
          description: 'Please allow notifications in your browser settings.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to enable notifications. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Disable notifications
  const handleDisableNotifications = useCallback(async () => {
    const currentToken = getStoredToken();

    // Remove token from Firestore
    if (currentToken) {
      await removeTokenFromFirestore(currentToken);
    }

    disableNotifications();
    setIsEnabled(false);
    setToken(null);
    toast({
      title: 'Notifications Disabled',
      description: 'You will no longer receive push notifications.',
    });
  }, []);

  // Toggle notifications
  const toggleNotifications = useCallback(async () => {
    if (isEnabled) {
      handleDisableNotifications();
      return false;
    } else {
      return await enableNotifications();
    }
  }, [isEnabled, enableNotifications, handleDisableNotifications]);

  return {
    isEnabled,
    isLoading,
    isSupported,
    token,
    enableNotifications,
    disableNotifications: handleDisableNotifications,
    toggleNotifications,
  };
}

export default useNotifications;
