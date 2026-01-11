import { GoogleGenAI } from '@google/genai';

export const config = {
    runtime: 'edge', // Enable Edge Runtime for longer streaming limits
};

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { fileBase64, mimeType, prompt, language1, language2 } = await req.json();

        if (!fileBase64 || !prompt) {
            return new Response(JSON.stringify({ error: 'Missing file or prompt' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!process.env.GEMINI_KEY) {
            console.error('Missing GEMINI_KEY environment variable');
            return new Response(JSON.stringify({ error: 'Server configuration error' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
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

        // Create a streaming response
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();

                try {
                    let streamResult;
                    // Model strategy based on speed/stability:
                    // 1. gemini-2.0-flash (Fastest & Stable)
                    // 2. gemini-2.5-flash
                    // 3. gemini-3-flash-preview

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
                            try {
                                streamResult = await ai.models.generateContentStream({
                                    model: 'gemini-3-flash-preview',
                                    contents,
                                    config: { temperature: 0.1 }
                                });
                            } catch (finalError: any) {
                                console.error("All models failed:", finalError.message);
                                throw new Error("Geen enkel AI model beschikbaar.");
                            }
                        }
                    }

                    // @ts-ignore
                    const streamSource = streamResult.stream || streamResult;

                    for await (const chunk of streamSource) {
                        let chunkText = '';

                        if (typeof chunk.text === 'function') {
                            chunkText = chunk.text();
                        } else if (typeof chunk.text === 'string') {
                            chunkText = chunk.text;
                        } else if (chunk.candidates?.[0]?.content?.parts?.[0]?.text) {
                            chunkText = chunk.candidates[0].content.parts[0].text;
                        } else if (chunk.candidates?.[0]?.content?.parts) {
                            chunkText = chunk.candidates[0].content.parts.map((p: any) => p.text).join('');
                        }

                        if (chunkText) {
                            controller.enqueue(encoder.encode(chunkText));
                        }

                        const finishReason = chunk.candidates?.[0]?.finishReason;
                        if (finishReason && finishReason !== 'STOP') {
                            if (finishReason === 'MAX_TOKENS') {
                                controller.enqueue(encoder.encode('\n\n[TRUNCATED_WARNING]'));
                            }
                        }
                    }
                    controller.close();

                } catch (err: any) {
                    console.error("Stream processing error:", err);
                    const errorMsg = `Error: ${err.message}`;
                    controller.enqueue(encoder.encode(errorMsg));
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
            }
        });

    } catch (error: any) {
        console.error('Edge Handler Top-Level Error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
