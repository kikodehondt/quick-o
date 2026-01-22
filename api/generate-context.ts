// @ts-ignore
import { GoogleGenAI } from '@google/genai';

export const config = {
    runtime: 'edge',
};

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { words, language } = await req.json();

        if (!words || !Array.isArray(words) || words.length === 0 || !language) {
            return new Response(JSON.stringify({ error: 'Missing words list or language' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!process.env.GEMINI_KEY) {
            return new Response(JSON.stringify({ error: 'Server configuration error' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // @ts-ignore
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

        const prompt = `
            Ik geef je een lijst met woorden in het ${language}. 
            Voor elk woord moet je een korte, eenvoudige contextzin genereren in het ${language} waarbij het woord zelf vervangen is door "___".
            De zin moet duidelijk genoeg zijn zodat iemand kan raden dat dit specifieke woord erin past.
            
            Woordenlijst: ${words.join(', ')}

            Geef het antwoord ENKEL als een JSON object, zonder markdown formatting.
            Formaat: { "woord": "zin met ___", ... }
        `;

        let result: any;

        // Strategy from generate-words.ts
        try {
            console.log("Attempting gemini-2.0-flash...");
            result = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: { responseMimeType: 'application/json', temperature: 0.3 }
            });
        } catch (e: any) {
            console.warn("gemini-2.0-flash failed:", e.message);
            try {
                console.log("Falling back to gemini-2.5-flash...");
                result = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    config: { responseMimeType: 'application/json', temperature: 0.3 }
                });
            } catch (e2: any) {
                console.warn("gemini-2.5-flash failed:", e2.message);
                console.log("Falling back to gemini-3-flash-preview...");
                try {
                    result = await ai.models.generateContent({
                        model: 'gemini-3-flash-preview',
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        config: { responseMimeType: 'application/json', temperature: 0.3 }
                    });
                } catch (e3: any) {
                    console.error("All models failed:", e3.message);
                    throw new Error("Geen enkel AI model beschikbaar.");
                }
            }
        }

        if (!result) {
            throw new Error('No result from AI');
        }

        // Simpler text extraction
        let responseText = '';
        if (result.response && typeof result.response.text === 'function') {
            responseText = result.response.text();
        } else {
            // Fallback for different SDK return shapes if necessary, 
            // but usually result.response.text() is the standard.
            // @ts-ignore
            if (result.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
                // @ts-ignore
                responseText = result.response.candidates[0].content.parts[0].text;
            } else {
                // @ts-ignore
                responseText = JSON.stringify(result); // Debugging aid if structure is totally different
            }
        }

        // Clean up markdown if present
        const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        let data;
        try {
            data = JSON.parse(cleanText);
        } catch (e) {
            console.error("Failed to parse JSON:", cleanText);
            throw new Error("Invalid JSON from AI");
        }

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({
            error: error.message || 'Server Error',
            details: error.toString()
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
