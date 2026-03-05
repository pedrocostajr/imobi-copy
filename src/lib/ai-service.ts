import { CopyFormData, CopyResult, parseCopyResponse } from "./copy-types";
import { supabase } from "@/integrations/supabase/client";

export async function generateCopy(data: CopyFormData): Promise<CopyResult> {
    const { data: result, error } = await supabase.functions.invoke("generate-copy", {
        body: data,
    });

    if (error) {
        console.error("Edge Function error:", error);
        throw new Error(error.message || "Erro ao gerar copy via Edge Function");
    }

    if (!result?.content) {
        throw new Error("Resposta inválida da Edge Function");
    }

    return parseCopyResponse(result.content);
}

export async function generateImage(prompt: string): Promise<string> {
    const { data, error } = await supabase.functions.invoke("generate-photo", {
        body: { prompt },
    });

    if (error) {
        console.error("Edge Function error:", error);
        throw new Error(error.message || "Erro ao gerar foto via Edge Function");
    }

    if (!data?.imageUrl) {
        throw new Error("Não foi possível obter a URL da imagem gerada.");
    }

    return data.imageUrl;
}
