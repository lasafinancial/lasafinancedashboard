const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env if present
function loadEnv() {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split(/\r?\n/).forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const eqIndex = trimmed.indexOf('=');
            if (eqIndex === -1) return;
            const key = trimmed.slice(0, eqIndex).trim();
            const value = trimmed.slice(eqIndex + 1).trim();
            process.env[key] = value;
        });
    }
}

loadEnv();

// Initialize Firebase Admin
if (!admin.apps.length) {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!key) {
        console.error("FIREBASE_SERVICE_ACCOUNT_KEY not found in env");
        process.exit(1);
    }

    let cleanKey = key.trim();
    if ((cleanKey.startsWith("'") && cleanKey.endsWith("'")) ||
        (cleanKey.startsWith('"') && cleanKey.endsWith('"'))) {
        cleanKey = cleanKey.slice(1, -1).trim();
    }

    const serviceAccount = JSON.parse(cleanKey);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

const docs = [
    {
        title: "Welcome to LASA Finance 🚀",
        category: "General",
        content: "Welcome to the next generation of market intelligence. LASA (Live Analytics & Sentiment Analysis) is designed for modern traders who value speed and data-driven accuracy.\n\n### Where to Start?\n1. **Market Dashboard**: Get a 10,000ft view of the market mood and RSI telemetry.\n2. **Scanners**: Use our proprietary filters to find stocks at critical pivot points.\n3. **Pro Analysis**: Access deeper insights and high-conviction 'Multi-Bagger' picks.\n\nOur philosophy is simple: Simplify complex data so you can trade with confidence."
    },
    {
        title: "Decoding the Reaction Zone 🎯",
        category: "Market Analysis",
        content: "The **Reaction Zone** is our most powerful scanner. It identifies levels where big institutions typically step in to buy or sell.\n\n### How to trade it:\n- **Green Zone**: Price has entered a strong historical support area. Look for a 'Reversal' tail on the candle.\n- **Red Zone**: Price is hitting a supply wall. This is often where profit-booking occurs.\n\n**Tip**: Combine Reaction Zone hits with an RSI below 30 for high-probability long setups."
    },
    {
        title: "Sentiment Score Secrets 🧠",
        category: "Market Analysis",
        content: "The LASA Sentiment Score (0-100) measures fear and greed in real-time. \n\n- **Score 0-30 (Extreme Fear)**: Often the best 'Contrarian' buying opportunities.\n- **Score 30-70 (Neutral)**: Stable market conditions; focus on individual stock breakouts.\n- **Score 70-100 (Extreme Greed)**: Be cautious. This is where market corrections often begin.\n\nWe calculate this by scanning order book depth, trend strength, and sector-wide momentum."
    },
    {
        title: "Near Resistance & Support Reversal 📉",
        category: "Market Analysis",
        content: "Understanding these two scanners is key to short-term scalping:\n\n1. **Near Resistance**: Stocks that are knocking on the ceiling. A breakout here with high volume leads to fast moves.\n2. **Support Reversal**: Stocks that have finished falling and are starting to bounce. These offer the 'Tightest Stop-Loss' setups.\n\nAlways check the **Volume** column; a move without volume is often a trap."
    },
    {
        title: "Why Upgrade to Pro? 💎",
        category: "Account & Billing",
        content: "LASA Pro is built for serious traders who want to stay ahead of the retail crowd.\n\n**Exclusive Benefits:**\n- **Reaction Zone Access**: Full list of institution-level buy/sell zones.\n- **Multi-Bagger Scanner**: High-potential picks designed for 2X-5X returns.\n- **Priority Alerts**: Receive breakout notifications 30 seconds before Free users.\n- **No Ads**: A clean, distraction-free environment.\n\nMost Pro users find that a single successful 'Multi-Bagger' trade covers the annual subscription cost."
    },
    {
        title: "Enabling Desktop Alerts 🔔",
        category: "Technical Setup",
        content: "Don't miss a breakout because your browser blocked a notification.\n\n### Setup Guide:\n1. Click the **Notification Bell** in the top right of the dashboard.\n2. When your browser asks for permission, click **'Allow'**.\n3. If it fails, go to Browser Settings -> Privacy -> Site Settings -> Notifications and ensure `lasafinance.com` is on the allowed list.\n\n**Note**: Mobile users should ensure their 'Do Not Disturb' mode is off for real-time push alerts."
    },
    {
        title: "Privacy & IP Compliance 🛡️",
        category: "Technical Setup",
        content: "To meet regulatory standards, we log the Public IP address and Timestamp when you accept our Terms of Service.\n\n**Why?**\nThis acts as a 'Digital Signature', proving that you have read and agreed to the market risks and disclaimers. This protects both the platform and you as a user. Your IP is stored securely in our encrypted database and is never shared with 3rd party marketers."
    }
];

async function seed() {
    console.log("Starting HelpDocs seed...");
    const collection = db.collection('help_articles');

    for (const docData of docs) {
        const snapshot = await collection.where('title', '==', docData.title).get();
        if (snapshot.empty) {
            await collection.add({
                ...docData,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`Added: ${docData.title}`);
        } else {
            console.log(`Skipped (Exists): ${docData.title}`);
        }
    }
    console.log("Seed complete!");
    process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
