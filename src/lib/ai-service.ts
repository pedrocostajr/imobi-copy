import { CopyFormData, CopyResult, parseCopyResponse } from "./copy-types";
import { supabase } from "@/integrations/supabase/client";

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
 * v7.0 - Vercel Serverless Bridge Strategy
 * Absolute bypass of local network blocks by fetching image bits on Vercel's server.
 */
export async function generateImage(prompt: string): Promise<string> {
    try {
        console.log("🚀 [v7.4] Iniciando Geração via VERCEL SERVERLESS BRIDGE...");

        // Em produção Vercel, a rota é relativa ao domínio
        const apiPath = "/api/generate-photo";

        const response = await fetch(apiPath, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt })
        });

        if (!response.ok) {
            let errorMsg = `Erro ${response.status}`;
            try {
                const text = await response.text();
                // Filtro para não exibir HTML ou Scripts no toast (v7.2)
                const isHtmlOrScript = text.includes("<!DOCTYPE") || text.includes("<script") || text.includes("<html") || text.includes("self.__next_f");

                if (isHtmlOrScript) {
                    errorMsg = "Erro de Roteamento ou Servidor (404/500). Verifique o deploy no Vercel.";
                } else {
                    try {
                        const errorData = JSON.parse(text);
                        errorMsg = errorData.error || errorMsg;
                    } catch (e) {
                        errorMsg = text.substring(0, 80);
                    }
                }
            } catch (e) { }
            throw new Error(errorMsg);
        }

        const data = await response.json();
        if (!data || !data.imageUrl) throw new Error("A Vercel não retornou os dados da imagem.");

        return data.imageUrl; // Retorna o base64
    } catch (err: any) {
        console.error("🚨 Erro Crítico v7.4:", err);
        throw new Error(`Falha Vercel v7.4: ${err.message || 'Erro de conexão'}`);
    }
}

export async function probeConnectivity(url: string): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        await fetch(url, { method: "HEAD", mode: "no-cors", signal: controller.signal });
        clearTimeout(timeoutId);
        return true;
    } catch (e) {
        return false;
    }
}
