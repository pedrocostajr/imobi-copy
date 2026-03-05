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

    // Preference list for 2026
    const preference = [
        "gemini-2.5-flash", "gemini-2.1-flash", "gemini-2.0-flash",
        "gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro",
        "gemini-pro", "gemini-1.0-pro"
    ];

    let selectedModel = preference.find(p => discovered.includes(p)) || discovered[0] || "gemini-1.5-flash";

    console.log(`🎯 Modelo Escolhido: ${selectedModel}`);

    const valorFinal = data.valor === "Personalizado" ? data.valorPersonalizado : data.valor;

    const systemPrompt = `Você é um Copywriter Especialista em Marketing Imobiliário. Tom: ${data.tom}. 
DADOS: ${data.tipo} em ${data.cidade}/${data.bairro}. Público: ${data.publico}. Valor: ${valorFinal}. Objetivo: ${data.objetivo}.

Crie uma copy envolvente para anúncio. NÃO cite os nomes das etapas AIDA (Atenção, Interesse, etc).

OBRIGATÓRIO: Forneça a resposta estruturada EXATAMENTE nestes ${data.modoAvancado ? '8' : '5'} blocos numerados abaixo, sem pular nenhum:

1. COPY PRINCIPAL:
2. HEADLINE PARA IMAGEM:
3. VERSÃO RESUMIDA:
4. MENSAGEM WHATSAPP:
5. CTA RECOMENDADO:
${data.modoAvancado ? `6. VARIAÇÕES DE HEADLINE:
7. VARIAÇÕES DE CTA:
8. ROTEIRO PARA REELS:` : ''}`;





    const endpoints = [
        `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent`,
        `https://generativelanguage.googleapis.com/v1/models/${selectedModel}:generateContent`
    ];

    let lastError = "";

    for (const url of endpoints) {
        try {
            console.log(`📡 Tentando endpoint: ${url}...`);
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
                console.log(`🎉 Sucesso com ${selectedModel}!`);
                return parseCopyResponse(content);
            }


            const errorBody = await response.json().catch(() => ({}));
            lastError = errorBody.error?.message || "Erro desconhecido";
            console.warn(`❌ Falha: ${response.status} - ${lastError}`);

            if (response.status === 403) {
                throw new Error("Sua chave de API não tem permissão para este modelo. Verifique se ativou a 'Generative Language API' no Google Cloud.");
            }
        } catch (e: any) {
            lastError = e.message;
        }
    }

    throw new Error(`Falha total. Verifique o console (F12) para o 'Diagnóstico Profundo'. Erro final: ${lastError}`);
}

export async function generateImage(prompt: string): Promise<string> {
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
    // Imagen 3 normally requires v1beta
    const IMAGEN_URL = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${GEMINI_API_KEY}`;

    try {
        const response = await fetch(IMAGEN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                instances: [{ prompt }],
                parameters: { sampleCount: 1 },
            }),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "Falha na foto");
        }

        const result = await response.json();
        return `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
    } catch (e: any) {
        console.error("🚨 Erro Foto:", e.message);
        throw e;
    }
}
