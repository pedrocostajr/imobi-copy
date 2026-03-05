import { CopyFormData, CopyResult, parseCopyResponse } from "./copy-types";

// Expanded list of models to try. Some keys/regions only accept specific versions.
const MODEL_CANDIDATES = [
    { url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent", name: "Gemini 1.5 Flash (v1beta)" },
    { url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent", name: "Gemini 1.5 Flash Latest (v1beta)" },
    { url: "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent", name: "Gemini 1.5 Flash (v1)" },
    { url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent", name: "Gemini 1.5 Pro (v1beta)" },
    { url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent", name: "Gemini Pro (v1beta)" },
    { url: "https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent", name: "Gemini 1.0 Pro" }
];

export async function generateCopy(data: CopyFormData): Promise<CopyResult> {
    console.log("🚀 Iniciando loop de resiliência expandido...");
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

    if (!GEMINI_API_KEY) {
        throw new Error("VITE_GEMINI_API_KEY não encontrada. Verifique suas configurações na Vercel.");
    }

    const valorFinal = data.valor === "Personalizado" ? data.valorPersonalizado : data.valor;

    const advancedBlock = data.modoAvancado
        ? `
### SEÇÕES ADICIONAIS (MODO AVANÇADO ATIVADO) ###
VARIAÇÕES DE HEADLINE: 3 alternativas.
VARIAÇÕES DE CTA: 2 alternativas.
ROTEIRO PARA REELS: 30 segundos com gancho, corpo e CTA.`
        : "";

    const systemPrompt = `Você é um Copywriter Sênior de Alta Performance Imobiliária.
DADOS: ${data.tipo} em ${data.cidade}/${data.bairro}. Valor: ${valorFinal}. Público: ${data.publico}.
OBJETIVO: ${data.objetivo}. TOM: ${data.tom}.

${advancedBlock}

REGRAS: Use AIDA. Responda APENAS com os blocos:
COPY PRINCIPAL:
HEADLINE PARA IMAGEM:
VERSÃO RESUMIDA:
MENSAGEM WHATSAPP:
CTA RECOMENDADO:`;

    let lastError = "";

    for (const model of MODEL_CANDIDATES) {
        try {
            console.log(`📡 Tentando modelo: ${model.name}...`);
            const response = await fetch(`${model.url}?key=${GEMINI_API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: systemPrompt }] }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
                }),
            });

            if (response.ok) {
                console.log(`✅ Sucesso absoluto com o modelo: ${model.name}! ✨`);
                const result = await response.json();
                const content = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
                return parseCopyResponse(content);
            }

            const errorBody = await response.json();
            const errorMsg = errorBody.error?.message || "Erro desconhecido";
            const errorCode = errorBody.error?.code || response.status;

            console.warn(`⚠️ Falha no ${model.name}: ${errorCode} - ${errorMsg}`);
            lastError = `${model.name} (${errorCode}): ${errorMsg}`;

            // If it's a critical auth error, stop early
            if (errorCode === 400 && errorMsg.includes("API key not valid")) {
                throw new Error("A chave de API configurada na Vercel parece ser inválida. Verifique os espaços ou caracteres extras.");
            }
        } catch (e: any) {
            console.error(`🚨 Erro de conexão com ${model.name}:`, e.message);
            lastError = e.message;
        }
    }

    throw new Error(`Exaurimos todas as tentativas. Último erro: ${lastError}`);
}

export async function generateImage(prompt: string): Promise<string> {
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
    // Using v1beta for Imagen 3 support
    const IMAGEN_URL = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${GEMINI_API_KEY}`;

    try {
        console.log("🚀 Gerando imagem com Imagen 3.0 Real-time...");
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
            console.error("❌ Erro Imagen API:", error);
            throw new Error(`Erro na Imagem (${response.status}): ${error.error?.message || 'Falha na geração'}`);
        }

        const result = await response.json();
        return `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
    } catch (error: any) {
        console.error("🚨 Erro crítico em generateImage:", error);
        throw error;
    }
}
