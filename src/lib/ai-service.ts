import { CopyFormData, CopyResult, parseCopyResponse } from "./copy-types";

// Universal candidates list covering all possible iterations of Gemini
const MODEL_CANDIDATES = [
    { url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent", name: "Gemini 1.5 Flash (v1beta)" },
    { url: "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent", name: "Gemini 1.5 Flash (v1)" },
    { url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", name: "Gemini 2.0 Flash (v1beta)" },
    { url: "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent", name: "Gemini 2.0 Flash (v1)" },
    { url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent", name: "Gemini 1.5 Flash Latest (v1beta)" },
    { url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent", name: "Gemini 1.5 Pro (v1beta)" },
    { url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent", name: "Gemini Pro (v1beta)" },
    { url: "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent", name: "Gemini Pro (v1)" }
];

export async function generateCopy(data: CopyFormData): Promise<CopyResult> {
    console.log("🔍 Diagnóstico de Inicialização...");
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

    // Diagnostic log (safe)
    if (GEMINI_API_KEY) {
        console.log(`✅ Chave detectada! Formato: ${GEMINI_API_KEY.substring(0, 4)}...${GEMINI_API_KEY.substring(GEMINI_API_KEY.length - 4)} (Total: ${GEMINI_API_KEY.length} chars)`);
    } else {
        console.error("❌ VITE_GEMINI_API_KEY está VAZIA. Verifique o painel da Vercel.");
        throw new Error("Chave de API não configurada corretamente na Vercel.");
    }

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

    let lastError = "";

    for (const model of MODEL_CANDIDATES) {
        try {
            console.log(`📡 Varredura: Tentando ${model.name}...`);
            const response = await fetch(`${model.url}?key=${GEMINI_API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: systemPrompt }] }],
                    generationConfig: { temperature: 0.7 }
                }),
            });

            if (response.ok) {
                console.log(`✨ SUCESSO! O modelo vencedor foi: ${model.name}`);
                const result = await response.json();
                const content = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
                return parseCopyResponse(content);
            }

            const errorBody = await response.json();
            const msg = errorBody.error?.message || "Sem detalhes";
            console.warn(`❌ ${model.name} falhou: ${response.status} - ${msg}`);
            lastError = `[${model.name}] ${response.status}: ${msg}`;

            // Critical quota error or auth error - usually applies to the whole key
            if (response.status === 429) {
                console.log("Trying to bypass quota with next model type...");
            }
        } catch (e: any) {
            console.error(`🚨 Fatal no ${model.name}:`, e.message);
            lastError = e.message;
        }
    }

    throw new Error(`Exaurimos todos os modelos disponíveis. Verifique se o Gemini está ativo na sua conta Google Cloud. Último erro: ${lastError}`);
}

export async function generateImage(prompt: string): Promise<string> {
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
    // Imagen 3 always on v1beta
    const IMAGEN_URL = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${GEMINI_API_KEY}`;

    try {
        console.log("🎨 Gerando imagem...");
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
            throw new Error(`Erro Imagem: ${error.error?.message || 'Falha'}`);
        }

        const result = await response.json();
        return `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
    } catch (error: any) {
        console.error("🚨 Erro Foto:", error);
        throw error;
    }
}
