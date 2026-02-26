import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

export const useActivityLogger = () => {
    const location = useLocation();
    const { user } = useAuth();
    const currentLogId = useRef<string | null>(null);
    const startTime = useRef<number>(Date.now());

    useEffect(() => {
        if (!user) return;

        const logActivity = async () => {
            try {
                startTime.current = Date.now();
                const docRef = await addDoc(collection(db, 'user_activity_logs'), {
                    uid: user.uid,
                    email: user.email || 'anonymous',
                    path: location.pathname,
                    timestamp: serverTimestamp(),
                    userAgent: navigator.userAgent,
                    action: 'page_view',
                    timeSpent: 0 // Initialize with 0
                });
                currentLogId.current = docRef.id;
            } catch (error) {
                console.error('[ActivityLogger] Failed to log activity:', error);
            }
        };

        logActivity();

        // Function to update the time spent
        const updateTimeSpent = async () => {
            if (currentLogId.current) {
                const duration = Math.floor((Date.now() - startTime.current) / 1000);
                if (duration > 0) {
                    try {
                        const logRef = doc(db, 'user_activity_logs', currentLogId.current);
                        await updateDoc(logRef, {
                            timeSpent: duration
                        });
                    } catch (error) {
                        console.error('[ActivityLogger] Failed to update time spent:', error);
                    }
                }
                currentLogId.current = null;
            }
        };

        // Handle tab closing/refreshing
        const handleBeforeUnload = () => {
            updateTimeSpent();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            updateTimeSpent();
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [location.pathname, user?.uid]);
};
