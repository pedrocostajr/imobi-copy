import { CopyFormData, CopyResult, parseCopyResponse } from "./copy-types";
import { supabase } from "@/integrations/supabase/client";

export async function generateCopy(data: CopyFormData): Promise<CopyResult> {
    console.log("Iniciando geração de copy via Supabase invoke...");

    // Using invoke is safer for URL routing and internal headers
    const { data: result, error } = await supabase.functions.invoke("generate-copy", {
        body: data,
    });

    if (error) {
        console.error("Erro na Edge Function (Copy):", error);
        throw new Error(`Falha na comunicação com o servidor de IA. Verifique se o backend está ativo.`);
    }

    if (!result?.content) {
        throw new Error("Resposta da IA veio vazia ou em formato inválido.");
    }

    return parseCopyResponse(result.content);
}

export async function generateImage(prompt: string): Promise<string> {
    console.log("Iniciando geração de imagem via Supabase invoke...");

    const { data, error } = await supabase.functions.invoke("generate-photo", {
        body: { prompt },
    });

    if (error) {
        console.error("Erro na Edge Function (Photo):", error);
        throw new Error(`Falha ao gerar foto. Verifique o backend.`);
    }

    if (!data?.imageUrl) {
        throw new Error("Não foi possível obter a URL da imagem gerada.");
    }

    return data.imageUrl;
}
