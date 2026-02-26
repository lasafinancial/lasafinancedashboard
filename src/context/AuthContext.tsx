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
    tier?: 'free' | 'pro';
    phoneNumber?: string;
    disclaimerAcceptedAt?: any;
    hasSeenOnboarding?: boolean;
    selectedCountry?: string;
    traderType?: 'Beginner' | 'Mid-level' | 'Expert';
    isDeactivated?: boolean;
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
                    name: firebaseUser.displayName || firebaseUser.phoneNumber || 'New User',
                    provider: firebaseUser.providerData[0]?.providerId || (firebaseUser.phoneNumber ? 'phone' : 'unknown'),
                    tier: 'free',
                    createdAt: serverTimestamp(),
                    lastLoginAt: serverTimestamp(),
                });
            } else {
                console.log("[AuthContext] Updating last login for existing user.");
                // Update last login
                await setDoc(userRef, {
                    lastLoginAt: serverTimestamp(),
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
                    tier: 'free',
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
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, data, { merge: true });
    };

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
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};
