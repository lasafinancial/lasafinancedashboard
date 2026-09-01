import { db } from './src/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const articles = [
    {
        title: "How to use Stock Scanners",
        category: "Market Analysis",
        content: "Our stock scanners help you find the best trading opportunities. \n\n1. Go to the Screeners page.\n2. Choose between 'Near Resistance', 'Support Reversal', or 'Reaction Zone'.\n3. Our ML model highlights stocks with the highest momentum. \n\nGreen highlights indicate bullish potential, while Red indicates high resistance."
    },
    {
        title: "Understanding RSI Verdicts",
        category: "Market Analysis",
        content: "Relative Strength Index (RSI) is a momentum oscillator.\n\n- Above 70: Overbought (Be cautious of a pullback)\n- Below 30: Oversold (Potential for a bounce)\n- 50-60: Bullish momentum\n- 40-50: Bearish consolidation\n\nOur LASA AI interprets these levels automatically in the Market Mood indicator."
    },
    {
        title: "Upgrading to Pro",
        category: "Account & Billing",
        content: "LASA Research Services Pro offers exclusive access to:\n- Reaction Zone Scanner\n- Advanced Multibagger alerts\n- Real-time notification priority\n\nTo upgrade, visit your Profile settings and click on 'Upgrade to Pro' or contact our support team via the Feedback button."
    },
    {
        title: "Setting up Notifications",
        category: "Technical",
        content: "To receive real-time alerts on your mobile or desktop:\n\n1. Click the 'Bell' icon in the Navbar.\n2. When prompted, click 'Allow' in your browser.\n3. Ensure your system's Do Not Disturb mode is off.\n\nYou will now receive major market breakout notifications automatically."
    }
];

export const seedHelpArticles = async () => {
    console.log("Seeding help articles...");
    for (const article of articles) {
        await addDoc(collection(db, 'help_articles'), {
            ...article,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    }
    console.log("Seeding complete!");
};
