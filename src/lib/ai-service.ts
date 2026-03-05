import { CopyFormData, CopyResult, parseCopyResponse } from "./copy-types";

async function listAvailableModels(apiKey: string): Promise<string[]> {
    try {
        console.log("🔍 Consultando lista de modelos permitidos para sua chave...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.models?.map((m: any) => m.name.replace("models/", "")) || [];
    } catch (e) {
        console.error("⚠️ Falha ao listar modelos:", e);
        return [];
    }
}

export async function generateCopy(data: CopyFormData): Promise<CopyResult> {
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

    if (!GEMINI_API_KEY) {
        throw new Error("Chave de API (VITE_GEMINI_API_KEY) não encontrada na Vercel.");
    }

    // Attempt discovery first to be precise
    const discoveredModels = await listAvailableModels(GEMINI_API_KEY);
    console.log("📋 Modelos encontrados:", discoveredModels.length > 0 ? discoveredModels.join(", ") : "Nenhum (usando fallback)");

    // Priority order for selection
    const preference = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];
    let bestModel = preference.find(p => discoveredModels.includes(p)) || (discoveredModels[0]) || "gemini-1.5-flash";

    console.log(`🎯 Modelo selecionado para esta tentativa: ${bestModel}`);

    const valorFinal = data.valor === "Personalizado" ? data.valorPersonalizado : data.valor;
    const systemPrompt = `Você é um Copywriter Sênior Imobiliário. 
DADOS: ${data.tipo} em ${data.cidade}/${data.bairro}. Valor: ${valorFinal}.
TOM: ${data.tom}. Use AIDA.

Responda APENAS com os blocos:
COPY PRINCIPAL:
HEADLINE PARA IMAGEM:
VERSÃO RESUMIDA:
MENSAGEM WHATSAPP:
CTA RECOMENDADO:`;

    const endpoints = [
        `https://generativelanguage.googleapis.com/v1beta/models/${bestModel}:generateContent`,
        `https://generativelanguage.googleapis.com/v1/models/${bestModel}:generateContent`,
        // Fallback safety if the best model fails or isn't in discovery
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
    ];

    let lastError = "";

    for (const url of endpoints) {
        try {
            console.log(`📡 Enviando para: ${url}...`);
            const response = await fetch(`${url}?key=${GEMINI_API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: systemPrompt }] }],
                    generationConfig: { temperature: 0.7 }
                }),
            });

            if (response.ok) {
                const result = await response.json();
                const content = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
                return parseCopyResponse(content);
            }

            const errorBody = await response.json();
            lastError = errorBody.error?.message || "Erro sem mensagem";
            console.warn(`❌ Falha no endpoint ${url}: ${lastError}`);
        } catch (e: any) {
            lastError = e.message;
        }
    }

    throw new Error(`O Google recusou todos os modelos para sua chave. Erro final: ${lastError}`);
}

export async function generateImage(prompt: string): Promise<string> {
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
    const IMAGEN_URL = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${GEMINI_API_KEY}`;

    try {
        console.log("🎨 Gerando foto...");
        const response = await fetch(IMAGEN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                instances: [{ prompt }],
                parameters: { sampleCount: 1 },
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Erro na foto');
        }

        const result = await response.json();
        return `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
    } catch (error: any) {
        throw error;
    }
}
