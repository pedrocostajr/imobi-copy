import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    // CORS Headers
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    try {
        const { prompt } = request.body;
        if (!prompt) {
            return response.status(400).json({ error: 'Prompt is required' });
        }

        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
        if (!OPENROUTER_API_KEY) {
            return response.status(500).json({ error: 'OPENROUTER_API_KEY not configured on Vercel' });
        }

        console.log(`🎨 [v8.1 VERCEL BRIDGE] Gerando imagem: ${prompt}`);

        // Chamada para OpenRouter (SDXL for speed)
        const orResponse = await fetch("https://openrouter.ai/api/v1/images/generations", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "X-Title": "Copylmob Real Estate",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "stabilityai/sdxl",
                prompt: `Professional real estate photography of ${prompt}, architectural style, 8k, clean wide angle, HD`,
                n: 1,
                size: "1024x1024",
                response_format: "b64_json"
            })
        });

        if (!orResponse.ok) {
            const errorDetail = await orResponse.text();
            return response.status(orResponse.status).json({ error: `OpenRouter Error: ${errorDetail}` });
        }

        const orData = await orResponse.json();
        const base64Image = orData.data?.[0]?.b64_json;

        if (!base64Image) {
            // Se OpenRouter retornar URL em vez de base64, baixamos no servidor Vercel
            const imageUrl = orData.data?.[0]?.url;
            if (imageUrl) {
                const imgRes = await fetch(imageUrl);
                const arrayBuffer = await imgRes.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const b64 = buffer.toString('base64');
                return response.status(200).json({
                    imageUrl: `data:image/png;base64,${b64}`,
                    version: "v8.1 VERCEL-PROXY"
                });
            }
            return response.status(500).json({ error: 'No image data returned from OpenRouter' });
        }

        console.log("✅ Imagem gerada e convertida em binário via Vercel.");

        return response.status(200).json({
            imageUrl: `data:image/png;base64,${base64Image}`,
            version: "v8.1 VERCEL-ELITE"
        });

    } catch (error: any) {
        console.error("🚨 Vercel API Error:", error);
        return response.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
