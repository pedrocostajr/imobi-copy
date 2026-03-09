import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // CORS Pre-flight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    if (!prompt) throw new Error("Prompt is required");

    console.log(`🎨 [v4.0] Gerando imagem para: ${prompt}`);

    // v4.0: Usamos Pollinations mas o download ocorre no SERVIDOR
    const cleanPrompt = prompt.trim().substring(0, 200).replace(/[?#&]/g, '');
    const quality = "professional real estate photo, 4k, interior";
    const seed = Math.floor(Math.random() * 1000000);
    const encoded = encodeURIComponent(`${cleanPrompt}, ${quality}`);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${seed}&nologo=true&model=turbo`;

    console.log(`📡 Fetching from: ${pollinationsUrl}`);

    // Download da imagem no servidor Supabase (baixa latência)
    const response = await fetch(pollinationsUrl);
    if (!response.ok) {
      throw new Error(`Erro ao buscar imagem do Pollinations: ${response.status}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(imageBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );

    console.log("✅ Imagem processada com sucesso no servidor.");

    return new Response(
      JSON.stringify({
        imageUrl: `data:image/png;base64,${base64Image}`,
        version: "v4.0 PROXY"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("🚨 generate-photo v4.0 proxy error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido na geração" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
