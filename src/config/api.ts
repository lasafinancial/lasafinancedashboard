import { Capacitor } from '@capacitor/core';

/**
 * LASA FINANCIAL - API Configuration
 * 
 * When running as a native app (Capacitor), we must use absolute URLs
 * because '/' refers to the local device filesystem, not the Vercel server.
 */

// Your production domain
export const PRODUCTION_URL = 'https://lasafinance.vercel.app';

// Detect if we are running on a native device (iOS/Android)
export const isNative = Capacitor.isNativePlatform();

/**
 * Resolves an API path to an absolute URL if on native, 
 * or keeps it relative if on web (to support local dev).
 */
export const getApiUrl = (path: string): string => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    if (isNative) {
        // Direct connect to the API server via the ADB tunnel (port 3001)
        if (window.location.hostname === 'localhost') {
            return `http://localhost:3001${cleanPath}`;
        }
        return `${PRODUCTION_URL}${cleanPath}`;
    }

    return cleanPath;
};
