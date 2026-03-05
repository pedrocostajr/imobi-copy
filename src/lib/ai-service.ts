import { CopyFormData, CopyResult, parseCopyResponse } from "./copy-types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export async function generateCopy(data: CopyFormData): Promise<CopyResult> {
    console.log("Iniciando geração de copy via Direct Fetch...");

    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-copy`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                "apikey": SUPABASE_ANON_KEY,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Erro na Edge Function (Copy):", response.status, errorText);
            throw new Error(`Erro ${response.status}: Falha na comunicação com o servidor de IA.`);
        }

        const result = await response.json();

        if (!result?.content) {
            throw new Error("Resposta da IA veio vazia ou em formato inválido.");
        }

        return parseCopyResponse(result.content);
    } catch (error: any) {
        console.error("Erro de conexão (Copy):", error);
        throw new Error(error.message || "Não foi possível conectar ao servidor de IA. Verifique sua conexão.");
    }
}

export async function generateImage(prompt: string): Promise<string> {
    console.log("Iniciando geração de imagem via Direct Fetch...");

    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-photo`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                "apikey": SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Erro na Edge Function (Photo):", response.status, errorText);
            throw new Error(`Erro ${response.status}: Falha ao gerar imagem.`);
        }

        const data = await response.json();

        if (!data?.imageUrl) {
            throw new Error("Não foi possível obter a URL da imagem gerada.");
        }

        return data.imageUrl;
    } catch (error: any) {
        console.error("Erro de conexão (Photo):", error);
        throw new Error(error.message || "Erro ao conectar ao serviço de fotos.");
    }
}
