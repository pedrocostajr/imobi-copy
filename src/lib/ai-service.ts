// Refined AI service for Gemini 3.1 Flash and Gemini 3.1 Flash Image Preview (2026 Models)
import { CopyFormData, CopyResult, parseCopyResponse } from "./copy-types";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-3.1-flash:generateContent";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export async function generateCopy(data: CopyFormData): Promise<CopyResult> {
    const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

    // Use OpenAI if key is available, otherwise use Gemini
    if (OPENAI_API_KEY) {
        return generateCopyOpenAI(data, OPENAI_API_KEY);
    }

    if (!GEMINI_API_KEY) {
        throw new Error("Nenhuma chave de API (Gemini ou OpenAI) configurada.");
    }

    const valorFinal = data.valor === "Personalizado" ? data.valorPersonalizado : data.valor;

    const advancedBlock = data.modoAvancado
        ? `
### SEÇÕES ADICIONAIS (MODO AVANÇADO ATIVADO) ###

VARIAÇÕES DE HEADLINE: 
Gere exatamente 3 headlines alternativas extras (curtas e impactantes). Use o formato:
- [Headline 1]
- [Headline 2]
- [Headline 3]

VARIAÇÕES DE CTA:
Gere exatamente 2 CTAs alternativos curtos e diretos. Use o formato:
- [CTA 1]
- [CTA 2]

ROTEIRO PARA REELS (30 SEGUNDOS):
Crie um roteiro dinâmico e visual. Divida em:
- [00-05s] GANCHO: O que falar e mostrar.
- [05-15s] REVELAÇÃO: Detalhes do imóvel.
- [15-25s] DIFERENCIAL: Por que é único.
- [25-30s] CHAMADA FINAL: O que fazer agora.`
        : "";

    const systemPrompt = `Você é um Copywriter Sênior de Alta Performance, focado em conversão extrema para o mercado imobiliário brasileiro.

DADOS DO IMÓVEL:
- Tipo: ${data.tipo} em ${data.cidade}/${data.bairro}
- Estágio: ${data.estagio}
- Valor: ${valorFinal} | ${data.temEntrada ? `Entrada: ${data.entrada}` : ""} | ${data.parcelas ? `Parcelas: ${data.parcelas}` : ""}
- Público-alvo: ${data.publico}
- Diferencial: ${data.diferencial}
- Objetivo: ${data.objetivo}
- Tom: ${data.tom}

### INSTRUÇÕES OBRIGATÓRIAS ###
1. COPY PRINCIPAL: Persuasiva (AIDA). SEM rótulos "Atenção:", "Interesse:", etc. Tekto fluido.
2. HEADLINE PARA IMAGEM: Curta (máx 8 palavras).
3. VERSÃO RESUMIDA: Até 280 caracteres.
4. MENSAGEM WHATSAPP: Texto de contato inicial do cliente.
5. CTA RECOMENDADO: Texto do botão.

FORMATO DE RESPOSTA (OBRIGATÓRIO):

COPY PRINCIPAL:
[Texto]

HEADLINE PARA IMAGEM:
[Texto]

VERSÃO RESUMIDA:
[Texto]

MENSAGEM WHATSAPP:
[Texto]

CTA RECOMENDADO:
[Texto]

${advancedBlock}

REGRAS: Resposta limpa, sem comentários. Foco em benefícios e sem clichês.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 4096, // Increased to avoid cuts
            }
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erro API Gemini");
    }

    const resultData = await response.json();
    const content = resultData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return parseCopyResponse(content);
}

async function generateCopyOpenAI(data: CopyFormData, apiKey: string): Promise<CopyResult> {
    const valorFinal = data.valor === "Personalizado" ? data.valorPersonalizado : data.valor;

    const advancedBlock = data.modoAvancado ? `
### MODO AVANÇADO ATIVADO ###
Gere também 3 variações de headline, 2 variações de CTA e um roteiro de Reels de 30 segundos.
` : "";

    const prompt = `Você é um Copywriter Sênior imobiliário Brasileiro. 
Crie uma copy para um imóvel do tipo ${data.tipo} em ${data.cidade}.
Diferencial: ${data.diferencial}.
Público: ${data.publico}.
Tom: ${data.tom}.

${advancedBlock}

Responda EXATAMENTE neste formato de blocos:
COPY PRINCIPAL: [conteúdo]
HEADLINE PARA IMAGEM: [conteúdo]
VERSÃO RESUMIDA: [conteúdo]
MENSAGEM WHATSAPP: [conteúdo]
CTA RECOMENDADO: [conteúdo]
VARIAÇÕES DE HEADLINE: [lista]
VARIAÇÕES DE CTA: [lista]
ROTEIRO PARA REELS: [conteúdo]`;

    const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4o",
            messages: [{ role: "system", content: prompt }],
            temperature: 0.7,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Erro API OpenAI");
    }

    const result = await response.json();
    const content = result.choices[0].message.content;
    return parseCopyResponse(content);
}

export async function generateImage(prompt: string): Promise<string> {
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        throw new Error("Chave Gemini necessária para fotos.");
    }

    const IMAGEN_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-3.1-flash-image-preview:predict?key=${GEMINI_API_KEY}`;

    const response = await fetch(IMAGEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            instances: [{ prompt }],
            parameters: { sampleCount: 1, aspectRatio: "1:1" },
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Erro Imagen");
    }

    const result = await response.json();
    return `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
}
