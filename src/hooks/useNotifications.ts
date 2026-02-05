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

    // Check if already enabled
    const enabled = isNotificationEnabled();
    setIsEnabled(enabled);

    if (enabled) {
      setToken(getStoredToken());
    }
  }, []);

  // Set up foreground message listener
  useEffect(() => {
    if (!isEnabled) return;

    const unsubscribe = onForegroundMessage((payload: NotificationPayload) => {
      // Show toast for foreground notifications
      toast({
        title: payload.notification?.title || 'LASA Dashboard',
        description: payload.notification?.body || 'New notification',
      });

      // Also show native notification if page is not focused
      if (document.hidden && Notification.permission === 'granted') {
        new Notification(payload.notification?.title || 'LASA Dashboard', {
          body: payload.notification?.body,
          icon: '/complogo.png',
          image: payload.data?.image || '/testingnoti.png',
        } as any);
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isEnabled]);

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
