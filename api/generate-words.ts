import { GoogleGenAI } from '@google/genai';

export const config = {
    maxDuration: 60,
    api: {
        bodyParser: {
            sizeLimit: '4mb',
        },
    },
};

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { fileBase64, mimeType, prompt, language1, language2 } = req.body;

        if (!fileBase64 || !prompt) {
            return res.status(400).json({ error: 'Missing file or prompt' });
        }

        if (!process.env.GEMINI_KEY) {
            console.error('Missing GEMINI_KEY environment variable');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });
        const fullPrompt = `${prompt}\n\nHIERBOVEN STAAN DE REGELS. HIERONDER VOLGT HET BESTAND DAT JE MOET VERWERKEN. EXTRACT ALLE WOORDEN UIT DIT BESTAND NAAR HET GEVRAAGDE FORMAAT ( ${language1} || ${language2} ).`;
        const cleanBase64 = fileBase64.replace(/^data:.+;base64,/, '');

        const contents = [
            {
                role: 'user',
                parts: [
                    { text: fullPrompt },
                    { inlineData: { data: cleanBase64, mimeType: mimeType || 'application/pdf' } }
                ]
            }
        ];

        let streamResult;
        // Model strategy based on speed/stability:
        // 1. gemini-2.0-flash (Fastest & Stable) - Best for preventing Vercel timeouts
        // 2. gemini-2.5-flash (Newer, slightly better quality?)
        // 3. gemini-3-flash-preview (Highest quality but likely slowest)

        try {
            console.log("Attempting gemini-2.0-flash (fastest)...");
            streamResult = await ai.models.generateContentStream({
                model: 'gemini-2.0-flash',
                contents,
                config: { temperature: 0.1 }
            });
        } catch (e: any) {
            console.warn("gemini-2.0-flash failed:", e.message);

            try {
                console.log("Falling back to gemini-2.5-flash...");
                streamResult = await ai.models.generateContentStream({
                    model: 'gemini-2.5-flash',
                    contents,
                    config: { temperature: 0.1 }
                });
            } catch (fallbackError: any) {
                console.warn("gemini-2.5-flash failed:", fallbackError.message);
                console.log("Falling back to gemini-3-flash-preview...");
                // Last resort
                try {
                    streamResult = await ai.models.generateContentStream({
                        model: 'gemini-3-flash-preview',
                        contents,
                        config: { temperature: 0.1 }
                    });
                } catch (finalError: any) {
                    console.error("All models failed:", finalError.message);
                    if (finalError.message.includes('404')) {
                        throw new Error("Geen enkel AI model (2.0, 2.5, 3.0) is beschikbaar voor jouw API key.");
                    }
                    throw finalError;
                }
            }
        }

        // Set headers for streaming
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        // Do not manually set Transfer-Encoding: chunked, let the server handle it

        console.log("Stream started...");

        // DEBUG: Check what we actually got back
        if (streamResult) {
            console.log("StreamResult type:", typeof streamResult);
            console.log("StreamResult keys:", Object.keys(streamResult));
            // Check if it's iterable directly
            console.log("Is iterable?", typeof streamResult[Symbol.asyncIterator] === 'function');
        }

        // @ts-ignore - Handle SDK version differences where stream might be the object itself
        const streamSource = streamResult.stream || streamResult;

        for await (const chunk of streamSource) {
            let chunkText = '';

            // Handle different chunk formats for compatibility
            if (typeof chunk.text === 'function') {
                chunkText = chunk.text();
            } else if (typeof chunk.text === 'string') {
                chunkText = chunk.text;
            } else if (chunk.candidates?.[0]?.content?.parts?.[0]?.text) {
                chunkText = chunk.candidates[0].content.parts[0].text;
            } else if (chunk.candidates?.[0]?.content?.parts) {
                // Join all parts if multiple
                chunkText = chunk.candidates[0].content.parts.map((p: any) => p.text).join('');
            } else {
                console.log("Received chunk with keys:", Object.keys(chunk));
            }

            if (chunkText) {
                res.write(chunkText);
            }

            // Check for truncation
            const finishReason = chunk.candidates?.[0]?.finishReason;
            if (finishReason && finishReason !== 'STOP') {
                console.warn(`Stream finished with reason: ${finishReason}`);
                if (finishReason === 'MAX_TOKENS') {
                    res.write('\n\n[TRUNCATED_WARNING]');
                }
            }
        }

        res.end();

    } catch (error: any) {
        console.error('Gemini API Error:', error);
        // If headers already sent (streaming started), we can't send JSON error.
        if (!res.headersSent) {
            const msg = error.message || '';
            if (msg.includes('429')) return res.status(429).json({ error: 'Gratis AI limiet bereikt.' });
            return res.status(500).json({ error: 'Error processing document' });
        } else {
            res.end(); // Just end stream if error mid-way
        }
    }
}
