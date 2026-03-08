import { CopyFormData, CopyResult, parseCopyResponse } from "./copy-types";

async function deepDiscovery(apiKey: string): Promise<string[]> {
    const versions = ["v1beta", "v1"];
    let allModels: string[] = [];

    console.log("🔍 Iniciando Descoberta Profunda de Modelos...");

    for (const v of versions) {
        try {
            console.log(`📡 Consultando modelos via ${v}...`);
            const response = await fetch(`https://generativelanguage.googleapis.com/${v}/models?key=${apiKey}`);

            if (!response.ok) {
                const errBody = await response.json().catch(() => ({}));
                console.warn(`⚠️ Falha em discovery ${v}:`, response.status, errBody.error?.message || "Sem detalhes");
                continue;
            }

            const data = await response.json();
            const discovered = data.models?.map((m: any) => m.name.replace("models/", "")) || [];
            console.log(`✅ ${v} retornou:`, discovered.join(", "));
            allModels = [...new Set([...allModels, ...discovered])];
        } catch (e: any) {
            console.error(`🚨 Fatal em discovery ${v}:`, e.message);
        }
    }

    return allModels;
}

export async function generateCopy(data: CopyFormData): Promise<CopyResult> {
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

    if (!GEMINI_API_KEY) {
        throw new Error("VITE_GEMINI_API_KEY não encontrada. Verifique as variáveis de ambiente na Vercel.");
    }

    console.log(`🧪 Diagnóstico: Chave de ${GEMINI_API_KEY.length} caracteres detectada.`);

    const discovered = await deepDiscovery(GEMINI_API_KEY);

    // Preference list for 2026 - We will try ALL of these if quota is hit
    const preference = [
        "gemini-2.5-flash", "gemini-2.1-flash", "gemini-2.0-flash",
        "gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro",
        "gemini-pro", "gemini-1.0-pro"
    ];

    // Priority filter: only try models actually listed by Google
    const modelsToTry = preference.filter(p => discovered.includes(p));
    if (modelsToTry.length === 0 && discovered.length > 0) {
        modelsToTry.push(discovered[0]); // Fallback to first available if none in preference
    } else if (modelsToTry.length === 0) {
        modelsToTry.push("gemini-1.5-flash"); // Absolute fallback
    }

    console.log(`📋 Sequência de modelos para tentativa: ${modelsToTry.join(", ")}`);

    const valorFinal = data.valor === "Personalizado" ? data.valorPersonalizado : data.valor;

    // Prompt ultra-estruturado para evitar truncamento e garantir completude
    const systemPrompt = `Você é um Copywriter Imobiliário. Tom: ${data.tom}. Objetivo: ${data.objetivo}.
DADOS: ${data.tipo} em ${data.cidade}/${data.bairro}. Público: ${data.publico}. Valor: ${valorFinal}.

INSTRUÇÃO: Gere os ${data.modoAvancado ? '8' : '5'} blocos numerados abaixo. SEJA PRECISO E BREVE para garantir que o Google entregue tudo sem cortes.

1. COPY PRINCIPAL:
2. HEADLINE PARA IMAGEM:
3. VERSÃO RESUMIDA:
4. MENSAGEM WHATSAPP:
5. CTA RECOMENDADO:
${data.modoAvancado ? `6. VARIAÇÕES DE HEADLINE:
7. VARIAÇÕES DE CTA:
8. ROTEIRO PARA REELS:` : ''}`;

    let lastError = "";

    // Outer loop: iterate through MODELS
    for (const modelId of modelsToTry) {
        const endpoints = [
            `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`,
            `https://generativelanguage.googleapis.com/v1/models/${modelId}:generateContent`
        ];

        // Inner loop: iterate through ENDPOINTS for each model
        for (const url of endpoints) {
            try {
                console.log(`📡 Tentando ${modelId} em ${url}...`);
                const response = await fetch(`${url}?key=${GEMINI_API_KEY}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: systemPrompt }] }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 2500,
                            topP: 0.95
                        }
                    }),
                });

                if (response.ok) {
                    const resData = await response.json();
                    const content = resData.candidates?.[0]?.content?.parts?.[0]?.text || "";
                    console.log("📄 Conteúdo bruto recebido:", content);
                    console.log(`🎉 Sucesso total com ${modelId}!`);
                    return parseCopyResponse(content);
                }

                const errorBody = await response.json().catch(() => ({}));
                lastError = errorBody.error?.message || "Erro desconhecido";

                // If Quota Exceeded (429), break inner loop to try NEXT model
                if (response.status === 429) {
                    console.warn(`⏳ Cota excedida para ${modelId}. Pulando para o próximo modelo...`);
                    break;
                }

                console.warn(`❌ Falha em ${modelId} (${url}): ${response.status} - ${lastError}`);
            } catch (e: any) {
                lastError = e.message;
            }
        }
    }

    throw new Error(`Exaurimos todos os modelos disponíveis e limites da API. Por favor, aguarde alguns minutos ou reduza a frequência de uso. Erro final: ${lastError}`);
}

export async function generateImage(prompt: string): Promise<string> {
    // Pollinations.ai is much more reliable for client-side usage.
    // We add quality keywords to ensure a professional real-estate look.
    // Using 'flux' model for superior architectural and interior quality.
    const qualityKeywords = "professional real estate photography, high resolution, 4k, architectural lighting, sharp focus";
    const enhancedPrompt = encodeURIComponent(`${prompt}, ${qualityKeywords}`);

    // Generates a random seed to keep images unique
    const seed = Math.floor(Math.random() * 1000000);

    // Use the official image subdomain with turbo model which is excellent for speed
    const imageUrl = `https://image.pollinations.ai/prompt/${enhancedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true&model=turbo`;

    console.log("🎨 Gerando URL da imagem via Pollinations.ai (Turbo):", imageUrl);

    return imageUrl;
}
