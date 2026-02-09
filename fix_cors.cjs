const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');

// 1. Load Environment Variables
function loadEnvFile() {
    try {
        const envPath = path.join(__dirname, '.env');
        if (!fs.existsSync(envPath)) return;
        const content = fs.readFileSync(envPath, 'utf8');
        content.split(/\r?\n/).forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const eqIndex = trimmed.indexOf('=');
            if (eqIndex === -1) return;
            const key = trimmed.slice(0, eqIndex).trim();
            const value = trimmed.slice(eqIndex + 1).trim();
            if (!(key in process.env)) process.env[key] = value;
        });
    } catch (error) {
        console.warn('Failed to load .env file:', error.message);
    }
}

loadEnvFile();

// 2. Get Credentials
function getFirebaseCredentials() {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!key) return null;
    try {
        let cleanKey = key.trim();
        if ((cleanKey.startsWith("'") && cleanKey.endsWith("'")) ||
            (cleanKey.startsWith('"') && cleanKey.endsWith('"'))) {
            cleanKey = cleanKey.slice(1, -1).trim();
        }
        return JSON.parse(cleanKey);
    } catch (e) {
        console.error('Failed to parse Firebase credentials:', e.message);
        return null;
    }
}

async function configureCors() {
    const credentials = getFirebaseCredentials();
    if (!credentials) {
        console.error('❌ Missing credentials.');
        return;
    }

    const storage = new Storage({
        projectId: credentials.project_id,
        credentials
    });

    try {
        console.log('Listing buckets...');
        const [buckets] = await storage.getBuckets();
        console.log('Buckets found:', buckets.map(b => b.name));

        if (buckets.length === 0) {
            console.error('❌ No buckets found in this project.');
            return;
        }

        // Try to find the correct bucket or use the first one
        // Priority: VITE_FIREBASE_STORAGE_BUCKET, then *.appspot.com, then first one
        const envBucket = process.env.VITE_FIREBASE_STORAGE_BUCKET;
        let targetBucket = null;

        if (envBucket) {
            targetBucket = buckets.find(b => b.name === envBucket);
        }

        if (!targetBucket) {
            targetBucket = buckets.find(b => b.name.includes('appspot.com'));
        }

        if (!targetBucket) {
            targetBucket = buckets[0];
        }

        console.log(`\nConfiguring CORS for bucket: ${targetBucket.name}...`);

        await targetBucket.setCorsConfiguration([
            {
                origin: ["*"],
                method: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                responseHeader: ["Authorization", "Content-Type", "x-goog-resumable"],
                maxAgeSeconds: 3600
            }
        ]);

        console.log(`✅ SUCCESS! CORS configured for ${targetBucket.name}`);
        console.log('You can now upload images from localhost.');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 403) {
            console.error('💡 Hint: The service account might need "Storage Admin" role in IAM.');
        }
    }
}

configureCors();
