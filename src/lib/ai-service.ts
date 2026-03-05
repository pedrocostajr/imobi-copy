import { CopyFormData, CopyResult, parseCopyResponse } from "./copy-types";

// Using stable v1 endpoint for Gemini 1.5 Flash
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";
// Using v1beta specifically for Imagen 3 support
const IMAGEN_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict";

export async function generateCopy(data: CopyFormData): Promise<CopyResult> {
    console.log("🚀 Iniciando geração de copy stable...");
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        throw new Error("VITE_GEMINI_API_KEY não encontrada. Verifique as variáveis de ambiente.");
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

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("❌ Erro Gemini API:", error);
            throw new Error(`Erro Gemini ${response.status}: ${error.error?.message || 'Falha na geração'}`);
        }

        const result = await response.json();
        const content = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
        return parseCopyResponse(content);
    } catch (error: any) {
        console.error("🚨 Erro crítico em generateCopy:", error);
        throw error;
    }
}

export async function generateImage(prompt: string): Promise<string> {
    console.log("🚀 Iniciando geração de imagem stable...");
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        throw new Error("VITE_GEMINI_API_KEY necessária para gerar fotos.");
    }

    try {
        const response = await fetch(`${IMAGEN_API_URL}?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                instances: [{ prompt }],
                parameters: { sampleCount: 1, aspectRatio: "1:1" },
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("❌ Erro Imagen API:", error);
            throw new Error(`Erro Imagen ${response.status}: ${error.error?.message || 'Falha na foto'}`);
        }

        const result = await response.json();

        if (!result.predictions?.[0]?.bytesBase64Encoded) {
            throw new Error("A API de imagem não retornou dados válidos.");
        }

        return `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
    } catch (error: any) {
        console.error("🚨 Erro crítico em generateImage:", error);
        throw error;
    }
}
