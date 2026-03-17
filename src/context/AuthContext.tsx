import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    onAuthStateChanged,
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    OAuthProvider,
    signInWithPopup,
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink,
    signInWithCustomToken
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, getDoc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { FEATURE_FLAGS } from '@/lib/featureFlags';

interface UserData {
    name?: string;
    tier?: 'free' | 'pro' | 'elite';
    phoneNumber?: string;
    disclaimerAcceptedAt?: any;
    hasSeenOnboarding?: boolean;
    selectedCountry?: string;
    traderType?: 'Beginner' | 'Mid-level' | 'Expert';
    isDeactivated?: boolean;
    disclaimerVersion?: string;
    acceptanceIP?: string;
    hasCompletedProfile?: boolean;
}

interface AuthContextType {
    user: User | null;
    userData: UserData | null;
    loading: boolean;
    twilioSendOtp: (phoneNumber: string) => Promise<any>;
    twilioVerifyOtp: (phoneNumber: string, code: string) => Promise<any>;
    signInWithGoogle: () => Promise<void>;
    signInWithMicrosoft: () => Promise<void>;
    sendMagicLink: (email: string) => Promise<void>;
    isAdminAuthorized: boolean;
    setAdminAuthorized: (isAuth: boolean) => void;
    updateUserData: (data: Partial<UserData>) => Promise<void>;
    logout: () => Promise<void>;
    isFree: boolean;
    isPro: boolean;
    isElite: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);

    useEffect(() => {
        let unsubscribeUserData: (() => void) | undefined;

        const syncUserToFirestore = async (firebaseUser: User) => {
            console.log("[AuthContext] Syncing user to Firestore:", firebaseUser.uid);
            const userRef = doc(db, 'users', firebaseUser.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                console.log("[AuthContext] Creating new user profile in Firestore.");
                // Initial profile creation
                await setDoc(userRef, {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    phoneNumber: firebaseUser.phoneNumber || '',
                    // We leave "name" empty for new users so they are forced to enter it in onboarding
                    provider: firebaseUser.providerData[0]?.providerId || (firebaseUser.phoneNumber ? 'phone' : 'unknown'),
                    tier: FEATURE_FLAGS.FORCE_ELITE_FOR_ALL ? 'elite' : 'free',
                    hasSeenOnboarding: false,
                    hasCompletedProfile: false,
                    createdAt: serverTimestamp(),
                    lastLoginAt: serverTimestamp(),
                });
            } else {
                console.log("[AuthContext] Updating last login for existing user.");
                // Update last login and respect ELITE tier force flag
                await setDoc(userRef, {
                    lastLoginAt: serverTimestamp(),
                    tier: FEATURE_FLAGS.FORCE_ELITE_FOR_ALL ? 'elite' : 'free',
                    // Ensure phoneNumber is updated if it was missing 
                    ...(firebaseUser.phoneNumber && { phoneNumber: firebaseUser.phoneNumber })
                }, { merge: true });
            }

            // Log session start for real users
            try {
                await addDoc(collection(db, 'user_activity_logs'), {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email || 'anonymous',
                    action: 'session_start',
                    timestamp: serverTimestamp(),
                    userAgent: navigator.userAgent
                });
            } catch (e) {
                console.error("Error logging session start:", e);
            }
        };

        if (FEATURE_FLAGS.BYPASS_LOGIN) {
            console.log("[AuthContext] BYPASS_LOGIN is active. Setting up Beta User.");

            const setupBypass = async () => {
                // Use a persistent "Virtual UID" for the browser session
                let virtualUid = localStorage.getItem('virtual_bypass_uid');
                if (!virtualUid) {
                    virtualUid = `beta_${Math.random().toString(36).substring(2, 9)}`;
                    localStorage.setItem('virtual_bypass_uid', virtualUid);
                }

                const mockUser = {
                    uid: virtualUid,
                    email: 'beta@lasafinancial.com',
                    displayName: 'Beta User',
                    isAnonymous: true,
                    emailVerified: true,
                    phoneNumber: null,
                    photoURL: null,
                    providerData: [],
                    metadata: {},
                } as any;

                setUser(mockUser);
                // In Guest mode, we still sync to firestore but we can mock the data locally too
                setUserData({
                    name: 'Beta User',
                    tier: 'elite',
                    hasSeenOnboarding: false, // Keep onboarding active as requested
                    disclaimerAcceptedAt: new Date(), // Pretend it's accepted to skip the modal
                });

                await syncUserToFirestore(mockUser);

                unsubscribeUserData = onSnapshot(doc(db, 'users', virtualUid), (doc) => {
                    if (doc.exists()) {
                        setUserData(doc.data() as UserData);
                    }
                    setLoading(false);
                });
            };

            setupBypass();
            return () => { if (unsubscribeUserData) unsubscribeUserData(); };
        }

        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            // ... (rest of existing logic)

            if (currentUser) {
                syncUserToFirestore(currentUser);
                // Subscribe to user data in Firestore
                unsubscribeUserData = onSnapshot(doc(db, 'users', currentUser.uid), (doc) => {
                    if (doc.exists()) {
                        const data = doc.data() as UserData;
                        // SECURITY: If user is deactivated, kick them out immediately
                        if (data.isDeactivated) {
                            console.warn("[AuthContext] User is deactivated. Logging out.");
                            firebaseSignOut(auth);
                            setUserData(null);
                        } else {
                            setUserData(data);
                        }
                    } else {
                        // For a truly new user, initialize with an empty object so logic in App.tsx triggers
                        setUserData({});
                    }
                    setLoading(false);
                });
            } else {
                setUserData(null);
                // Only set loading to false if we're not about to process a magic link
                if (!isSignInWithEmailLink(auth, window.location.href)) {
                    setLoading(false);
                }
            }
        });

        // Handle Email Magic Link redirect
        if (isSignInWithEmailLink(auth, window.location.href)) {
            setLoading(true); // Ensure loading is true while processing
            let email = window.localStorage.getItem('emailForSignIn');
            if (!email) {
                email = window.prompt('Please provide your email for confirmation');
            }
            if (email) {
                signInWithEmailLink(auth, email, window.location.href)
                    .then(() => {
                        window.localStorage.removeItem('emailForSignIn');
                        window.history.replaceState({}, '', '/');
                        // Note: onAuthStateChanged will naturally handle setting loading to false
                        // once the new user session is established.
                    })
                    .catch((err) => {
                        console.error('Error signing in with logic link:', err);
                        setLoading(false);
                    });
            } else {
                setLoading(false);
            }
        }

        return () => {
            unsubscribeAuth();
            if (unsubscribeUserData) unsubscribeUserData();
        };
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    const signInWithMicrosoft = async () => {
        const provider = new OAuthProvider('microsoft.com');
        // Optional: provider.setCustomParameters({ prompt: 'select_account' });
        await signInWithPopup(auth, provider);
    };

    const sendMagicLink = async (email: string) => {
        const actionCodeSettings = {
            url: window.location.origin + '/login',
            handleCodeInApp: true,
        };
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', email);
    };

    // Twilio OTP Methods
    const twilioSendOtp = async (phoneNumber: string) => {
        const response = await fetch('/api/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to send OTP via Twilio');
        return data;
    };

    const twilioVerifyOtp = async (phoneNumber: string, code: string) => {
        const response = await fetch('/api/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber, code }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Verification failed');

        // Final step: Sign in to Firebase client-side using the custom token from our backend
        return signInWithCustomToken(auth, data.customToken);
    };

    const logout = async () => {
        if (FEATURE_FLAGS.BYPASS_LOGIN) {
            localStorage.removeItem('virtual_bypass_uid');
            window.location.reload();
            return;
        }
        await firebaseSignOut(auth);
    };

    const updateUserData = async (data: Partial<UserData>) => {
        if (!user) return;

        // Optimistic update
        setUserData(prev => prev ? { ...prev, ...data } : data as UserData);

        const userRef = doc(db, 'users', user.uid);
        try {
            await setDoc(userRef, data, { merge: true });
        } catch (error) {
            console.error("Error updating user data:", error);
            // Revert on error if necessary, but for onboarding flags it's usually safe to keep local
        }
    };

    // Helper booleans for Tier logic
    // FORCE_ELITE_FOR_ALL toggle: 
    // - true: Everyone is ELITE
    // - false: Everyone is FREE (unless the tier system is disabled)
    const isElite = FEATURE_FLAGS.FORCE_ELITE_FOR_ALL || (userData?.tier === 'elite' || !FEATURE_FLAGS.ENABLE_TIER_RESTRICTIONS);
    const isPro = FEATURE_FLAGS.FORCE_ELITE_FOR_ALL || userData?.tier === 'pro' || isElite;
    const isFree = !FEATURE_FLAGS.FORCE_ELITE_FOR_ALL && (userData?.tier === 'free' || !userData?.tier) && FEATURE_FLAGS.ENABLE_TIER_RESTRICTIONS;

    return (
        <AuthContext.Provider value={{
            user,
            userData,
            loading,
            twilioSendOtp,
            twilioVerifyOtp,
            signInWithGoogle,
            signInWithMicrosoft,
            sendMagicLink,
            isAdminAuthorized,
            setAdminAuthorized: setIsAdminAuthorized,
            updateUserData,
            logout,
            isFree,
            isPro,
            isElite
        }}>
            {children}
        </AuthContext.Provider>
    );
};
