import { useState, useEffect } from 'react';
import { Bell, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { requestNotificationPermission, saveTokenToFirestore } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';

export function NotificationPromptBanner() {
  const [show, setShow] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Only show if supported, permission is 'default', and not dismissed
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const isDismissed = localStorage.getItem('notification_prompt_dismissed') === 'true';
    if (Notification.permission === 'default' && !isDismissed) {
      // Small delay to let page load smoothly first
      const timer = setTimeout(() => {
        setShow(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const token = await requestNotificationPermission();
      if (token) {
        await saveTokenToFirestore(token);
        toast({
          title: "Notifications Enabled! 🔔",
          description: "You will now receive real-time market breakout alerts.",
        });
        setShow(false);
      } else if (Notification.permission === 'denied') {
        toast({
          title: "Permission Blocked",
          description: "Please allow notifications in browser site settings.",
          variant: "destructive"
        });
        setShow(false);
      }
    } catch (e: any) {
      console.error('Error enabling notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('notification_prompt_dismissed', 'true');
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-2 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-xl"
      >
        <div className="p-3.5 px-5 rounded-2xl bg-gradient-to-r from-primary/90 via-purple-950/95 to-slate-900/95 backdrop-blur-xl border border-primary/40 shadow-2xl shadow-primary/20 flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-primary/20 border border-primary/30 shrink-0">
              <Bell className="w-5 h-5 text-primary animate-bounce" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold truncate">Enable Market Breakout Alerts</p>
              <p className="text-[11px] text-white/70 truncate hidden sm:block">Get instant notifications on your phone & laptop</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={handleEnable}
              disabled={loading}
              className="h-8 text-xs px-3 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/30"
            >
              {loading ? "Enabling..." : "Enable Alerts"}
            </Button>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
