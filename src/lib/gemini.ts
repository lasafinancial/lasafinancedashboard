const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export interface NarrationInput {
    symbol: string;
    price: number;
    bias: string;
    action: string;
    signals: string[];
    warnings: string[];
    support: number;
    resistance: number;
    balance: number;
    modelTarget: number;
    patternTarget: number;
    marketContext?: "NORMAL" | "TRENDING";
}

export async function getStockNarration(input: NarrationInput): Promise<string> {
    if (!GEMINI_API_KEY) {
        console.error("Gemini API key is missing");
        return "";
    }

    const prompt = `
Act as a Senior Market Strategist at LASA Financial. 
Your goal is to provide a highly detailed, professional, and conversational narration of a stock's technical setup.

Stock: ${input.symbol}
Current Price: ₹${input.price.toLocaleString()}
Bias: ${input.bias}
Action: ${input.action}
Market Context: ${input.marketContext || 'NORMAL'}

TECHNICAL DATA:
- Support: ₹${input.support.toLocaleString()}
- Resistance: ₹${input.resistance.toLocaleString()}
- Balance (FVG): ₹${input.balance.toLocaleString()}
- Model Target (20d): ₹${input.modelTarget.toLocaleString()}
- Pattern Target: ₹${input.patternTarget.toLocaleString()}
- Signals: ${input.signals.join(', ')}
- Warnings: ${input.warnings.join(', ')}

STRICT STYLE INSTRUCTIONS:
1. Write 8-12 sentences of high-quality market commentary.
2. If Market Context is "TRENDING", center the story around "Price Discovery". Explain that the stock is moving strongly THROUGH resistance and why Support ₹${input.support} is now the ultimate "Line in the Sand".
3. If any Warning starts with "⛔ HARD STOP HIT", explicitly emphasize the immediate mandatory exit in a professional but firm tone.
4. Use the ANALOGY: "Line in the sand" for Support levels specifically. Explain that if it holds, the trend continues; if it breaks, the bullish narrative is dead.
5. Use the ANALOGY: "Pullback magnet" or "Upside magnet" for the Balance (FVG). 
6. Provide SCENARIO-BASED analysis: "If ₹[Level] holds, then [Target], but if it fails, then [Support/Stop]".
7. Tone: Premium, authoritative, storytelling. NEVER use bullet points.
8. Use Vocabulary: "make-or-break level", "active Balance", "magnet for price", "price discovery mode", "undervalued/overextended", "downside comes into play", "wait for support confirmation".

Narration:`;

    try {
        const response = await fetch(GEMINI_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        const data = await response.json();

        // Handle the "High Demand" 503 error or other API issues
        if (data.error) {
            console.warn("Gemini API Error (likely demand spike):", data.error.message);
            return ""; // Fallback will take over
        }

        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            return data.candidates[0].content.parts[0].text.trim();
        }

        return "";
    } catch (error) {
        console.error("Error fetching narration:", error);
        return "";
    }
}
