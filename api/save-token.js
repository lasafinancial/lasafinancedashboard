import admin from 'firebase-admin';

const FALLBACK_BASE64 = 'eyJ0eXBlIjoic2VydmljZV9hY2NvdW50IiwicHJvamVjdF9pZCI6Imxhc2EtZGFzaGJvYXJkLTJmMjFkIiwicHJpdmF0ZV9rZXlfaWQiOiIzZmVhNGJmZWE3NDVmNzRiZDFkYWY0M2ZiZTMzM2UyOWM3YTJjNTVhIiwicHJpdmF0ZV9rZXkiOiItLS0tLUJFR0lOIFBSSVZBVEUgS0VZLS0tLS1cbk1JSUV2QUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktZd2dnU2lBZ0VBQW9JQkFRRENGY0Y0alJwZlQyRzhcbkZDVjVwS2JENCtYenJlRHU1RFRST1RXZ3BiZ3FjZVErcG1UNUNPQzdBWlM4aE5vS2NrcXRwTnJlNFcwblUwNi9cbnpDS1g1MTFJU1JIYUczSCtxV2xLWnZHZUJWZkJuVFlYTG5XUnBtd1RBZFY1N0xERlFrR0ZYa2ZHdnYrbzdwT09cbnpvTmFub3RITXB0Ull6QUZ5R1RrTXhobW1XNHFtWmNhUXNnaUwwWHltQnJKTlRrNHpOSktRaFI4Si9YQmppQnhcbmdJMVlFcmh3U0lSRE5XWHYwamtLUWpUZWdaaGExTnpEZmpqOTlBU0dqMzVscjZQRGwwNHVHK3BEbDZ6N05ZZHlcbnQ2Z2FBamRvaStRS2J6ZjZOem5uaWZsRVJQaGtWZVp5SDgxWmJaa3BaTStqRFRpRzhOU01WRHZwN2t6NnhIQmRcbmw0aEVxQ20zQWdNQkFBRUNnZ0VBTVVEakpjd3ROcVhIQ0R0V25VMm5Fb3hKeFhMSlkrYWU3citsZDl6R1pXTWNcbnlMZGlaWDZXeFc1cnlBR3c4Ymk2Y2VHbHQ2MGVqYjNLL01wNXR2SDhqc1VZVmpEajEzdzNuNjJMUUk1YmpHTndcbm9DWm1xSzFDdlBvWXFrWGlRRlVGbXFwbjdheDM1ZStSbThxVnRCQUxDV2p5Mkk4aTF6elpPYjRyd1pITFR0elVcbjVsMlhQSTVCSFBwTGNzVU5sV0dGVHFoZWs3ODVJYWVGUGxxZkVmZFBSODcvdTYyZHc0SjVheEdDNVpNVDlCcXNcbnFneFdOL3VMbnFYYXZpR3N2WHptdHh5SlhaZnk4RmwrNTFqS25UUWdPS1Rmd1pyajJVamRIbnlXcGZsV3krWldcbnVzTTVvdFQ1RVVDYUh3Ym1rVUIveUU5bittUCszWTRVRkR2cEJVNWNnUUtCZ1FEeG95ZlBzM2FObkdoNU03UXRcbmEyb1Y0UDRlYy81VTl6Tm04NUdWZHRsZklrZkd1NmlUOVR5b2tzTzIyV1RNQ0l5UnZiRVVldmhGN2tXbjNocnZcbitRVkxCL0hTbHVrRHorUWVueHhCZzRmL3J3em9NMUtKY1J5UW1ka2FBaDZWTDBVbEx3U2hBZDdvaXlzVXZva2RcbnhSVnloR1BoQkw5WEw4U1AzUkxYNWh2WU53S0JnUURObndhZ3NYQytBMDZDZDVUQ0tISXI5yWFPek9tUEMzaE5cbmhBQU1Jb3M1cjgxcDJtN2w3UEZkdlg0VHc2M3c2Z3JsWWZpekFLcWx6V1NUa0pvbFFTTHQ2anJjNldpUUh2MVlcbjVkWWZwdElPVm5tSlVCZzc2NlM5dFdFUFhkdEtpWU9pZTdwakNjN3NuVTZhckpoR1lJOWh6WlZGK09qSUtVT1Fcbk5jWEptaHA2Z1FLQmdGMUtGbGF6L0xOVGpXb3RzZ1JQRWhmOFUxL0NmSkNsRjYxSm9BMUtZMFc5WUdTemtyUDhcbjNEeGczVHE4MTVPR1FXOExBMURhNFB0dXNHbk04QzF4d0w5bEE5Ry8vWnBCS3RzL3BwTU1pdmNGeUQvbGdKb2JcbmwyR2taQk1NZW00eVg4bXBTMm8xNUs5MisxejQ2c3NaaWR3NmpLMFZQaUlWQ1JoWnk2cWE1bWtsQW9HQVVMbHFcbi83Rkp3cjlIbGo3ZUh1K0VDekNuYVk2Vzd2cWd5MFhVUXU5WTIxZmllL2t1YW9RQUtqNFhmaWpuWTlwdVZxbUVcbjJybWJSU2FDb3RBMVJBVHpjcFh2Y0FVT2NPNUpwaG50VzFYQng3RTVXNmdmSzM4U21RdlpSQkFqNUhwaVBHcjRcbnZLTUFJcktMUm53VitDTTJoejRQcVgzVDNha2Roa01tR0VTd3VvRUNnWUE4TDVWQXF1clh5VExrSU1oVDkwUkZcblVtcVpUUHFoQUVYN1lFOGFULy9xTElabWpEZEJGT2FFbDcrWVpaQjBDUWphSkQxNjlGN3RFTm9rV21DbHhGRmtcbjdyRTlINUtSU3E3ZjFtdUlrSGdpR2k2eUJVQlVERXBxTVFpa2FxVm5oN2gzYnFDbk1CK1RTZVk4bDhHdU1YY0Ncbk4xMTBOcHRjRXh5ak5oc3Q2SkE5dFE9PVxuLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLVxuIiwiY2xpZW50X2VtYWlsIjoiZmlyZWJhc2UtYWRtaW5zZGstZmJzdmNAbGFzYS1kYXNoYm9hcmQtMmYyMWQuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLCJjbGllbnRfaWQiOiIxMTAwMjg4MTQ0ODA1NjMwODk2MDEiLCJhdXRoX3VyaSI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbS9vL29hdXRoMi9hdXRoIiwidG9rZW5fdXJpIjoiaHR0cHM6Ly9vYXV0aDIuZ29vZ2xlYXBpcy5jb20vdG9rZW4iLCJhdXRoX3Byb3ZpZGVyX3g1MDlfY2VydF91cmwiOiJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9vYXV0aDIvdjEvY2VydHMiLCJjbGllbnRfeDUwOV9jZXJ0X3VybCI6Imh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL3JvYm90L3YxL21ldGFkYXRhL3g1MDkvZmlyZWJhc2UtYWRtaW5zZGstZmJzdmMlNDBsYXNhLWRhc2hib2FyZC0yZjIxZC5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsInVuaXZlcnNlX2RvbWFpbiI6Imdvb2dsZWFwaXMuY29tIn0=';

function getCredentials() {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 || FALLBACK_BASE64;
    try {
        const decoded = Buffer.from(base64Key, 'base64').toString('utf-8');
        const creds = JSON.parse(decoded);
        if (creds?.private_key) creds.private_key = creds.private_key.replace(/\\n/g, '\n').trim();
        return creds;
    } catch (e) {
        return null;
    }
}

if (!admin.apps.length) {
    const creds = getCredentials();
    admin.initializeApp({
        credential: admin.credential.cert(creds),
        projectId: 'lasa-dashboard-2f21d'
    });
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { token, userAgent, platform } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    try {
        const db = admin.firestore();
        await db.collection('fcm_tokens').doc(token).set({
            token,
            updatedAt: new Date().toISOString(),
            userAgent: userAgent || 'Unknown',
            platform: platform || 'Unknown'
        }, { merge: true });

        return res.status(200).json({ success: true, message: 'Token saved successfully via Admin SDK' });
    } catch (err) {
        console.error('Error saving token via API:', err);
        return res.status(500).json({ error: err.message });
    }
}
