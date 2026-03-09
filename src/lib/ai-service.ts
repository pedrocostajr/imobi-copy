import { CopyFormData, CopyResult, parseCopyResponse } from "./copy-types";

async function deepDiscovery(apiKey: string): Promise<string[]> {
    const versions = ["v1beta", "v1"];
    let allModels: string[] = [];
    for (const v of versions) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/${v}/models?key=${apiKey}`);
            if (!response.ok) continue;
            const data = await response.json();
            const discovered = data.models?.map((m: any) => m.name.replace("models/", "")) || [];
            allModels = [...new Set([...allModels, ...discovered])];
        } catch (e: any) { }
    }
    return allModels;
}

export async function generateCopy(data: CopyFormData): Promise<CopyResult> {
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
    if (!GEMINI_API_KEY) throw new Error("VITE_GEMINI_API_KEY não encontrada.");
    const discovered = await deepDiscovery(GEMINI_API_KEY);
    const preference = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"];
    const modelsToTry = preference.filter(p => discovered.includes(p));
    if (modelsToTry.length === 0) modelsToTry.push("gemini-1.5-flash");

    const valorFinal = data.valor === "Personalizado" ? data.valorPersonalizado : data.valor;
    const systemPrompt = `Você é um Copywriter Imobiliário. Tom: ${data.tom}. Objetivo: ${data.objetivo}. DADOS: ${data.tipo} em ${data.cidade}/${data.bairro}. Público: ${data.publico}. Valor: ${valorFinal}. INSTRUÇÃO: Gere 5 blocos numerados: 1. COPY PRINCIPAL, 2. HEADLINE PARA IMAGEM, 3. VERSÃO RESUMIDA, 4. MENSAGEM WHATSAPP, 5. CTA RECOMENDADO.`;

    for (const modelId of modelsToTry) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${GEMINI_API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: systemPrompt }] }],
                    generationConfig: { temperature: 0.7 }
                }),
            });
            if (response.ok) {
                const resData = await response.json();
                return parseCopyResponse(resData.candidates?.[0]?.content?.parts?.[0]?.text || "");
            }
        } catch (e) { }
    }
    throw new Error("Erro na geração da copy.");
}

/**
 * v3.0 - Maximum Reliability Strategy
 */
export async function generateImage(prompt: string, provider: "ai" | "stock" = "ai"): Promise<string> {
    const cleanPrompt = prompt.trim().substring(0, 150).replace(/[?#&]/g, '');
    const seed = Math.floor(Math.random() * 1000000);

    if (provider === "stock") {
        // v3.0: LoremFlickr is much more stable than Unsplash source in restricted networks
        const searchTags = "realestate,interior,house";
        return `https://loremflickr.com/1080/1080/${searchTags}?lock=${seed}`;
    }

    // Try high-stability AI path
    const quality = "real estate photography, architectural, 4k";
    const encoded = encodeURIComponent(`${cleanPrompt}, ${quality}`);

    return `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${seed}&nologo=true&model=turbo`;
}

export async function probeConnectivity(url: string): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const response = await fetch(url, {
            method: "GET",
            mode: "no-cors",
            signal: controller.signal,
            cache: 'no-store'
        });
        clearTimeout(timeoutId);
        return true;
    } catch (e) {
        return false;
    }
}
