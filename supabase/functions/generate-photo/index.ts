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

    console.log(`🎨 [v5.0 PURE BRIDGE] Gerando imagem para: ${prompt}`);

    // v5.0: Geração via Pollinations no servidor (Deno)
    const cleanPrompt = prompt.trim().substring(0, 300).replace(/[?#&]/g, '');
    const quality = "ultra-realistic real estate photography, professional interior design, 8k, highly detailed";
    const seed = Math.floor(Math.random() * 1000000);
    const encoded = encodeURIComponent(`${cleanPrompt}, ${quality}`);

    // Tentamos o modelo premium 'flux' via Pollinations no servidor
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${seed}&nologo=true`;

    console.log(`📡 Server-to-Server request: ${pollinationsUrl}`);

    const response = await fetch(pollinationsUrl);
    if (!response.ok) {
      throw new Error(`Erro API IA: ${response.status}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(imageBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );

    console.log("✅ Imagem convertida em BINÁRIO com sucesso.");

    return new Response(
      JSON.stringify({
        imageUrl: `data:image/png;base64,${base64Image}`,
        version: "v5.0 PURE BRIDGE"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("🚨 generate-photo v5.0 error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro crítico na ponte v5.0" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
