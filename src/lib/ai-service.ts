import { CopyFormData, CopyResult, parseCopyResponse } from "./copy-types";
import { supabase } from "@/integrations/supabase/client";

export async function generateCopy(data: CopyFormData): Promise<CopyResult> {
    console.log("🚀 Iniciando geração de copy...");

    try {
        const { data: result, error } = await supabase.functions.invoke("generate-copy", {
            body: data,
        });

        if (error) {
            console.error("❌ Erro invoke Copy:", error);
            // Re-throw with more detail
            throw new Error(`Erro Supabase: ${error.message || 'Falha na conexão'}. Verifique o console do navegador.`);
        }

        if (!result?.content) {
            console.error("⚠️ Resposta vazia da Edge Function:", result);
            throw new Error("A IA retornou uma resposta vazia. Tente novamente.");
        }

        return parseCopyResponse(result.content);
    } catch (error: any) {
        console.error("🚨 Erro crítico em generateCopy:", error);
        throw new Error(error.message || "Erro desconhecido ao gerar copy.");
    }
}

export async function generateImage(prompt: string): Promise<string> {
    console.log("🚀 Iniciando geração de imagem...");

    try {
        const { data, error } = await supabase.functions.invoke("generate-photo", {
            body: { prompt },
        });

        if (error) {
            console.error("❌ Erro invoke Photo:", error);
            throw new Error(`Erro Foto: ${error.message || 'Falha na conexão'}`);
        }

        if (!data?.imageUrl) {
            throw new Error("Não foi possível obter a URL da imagem.");
        }

        return data.imageUrl;
    } catch (error: any) {
        console.error("🚨 Erro crítico em generateImage:", error);
        throw new Error(error.message || "Erro ao gerar foto.");
    }
}
