import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    if (!prompt) throw new Error("Prompt is required");

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) {
      console.error("🚨 OPENROUTER_API_KEY não configurada no Supabase.");
      // Fallback para Pollinations no servidor se a chave falhar (v5.1 logic)
      return await handlePollinationsFallback(prompt);
    }

    console.log(`🎨 [v6.0 OPENROUTER] Gerando imagem: ${prompt}`);

    // Tentamos usar o modelo Flux via OpenRouter (Alta qualidade e rápido)
    const orResponse = await fetch("https://openrouter.ai/api/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "X-Title": "Copylmob Real Estate",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/dall-e-3", // DALL-E 3 é o mais estável para essa chamada
        prompt: `Professional high-end real estate photography of ${prompt}, architectural style, 8k, warm lighting, luxurious feel, clean wide angle shot`,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json" // Vantagem total: OpenRouter já devolve os pixels!
      })
    });

    if (!orResponse.ok) {
      const errorDetail = await orResponse.text();
      console.warn(`⚠️ OpenRouter Error: ${orResponse.status}. Detalhe: ${errorDetail}`);
      // Se OpenRouter falhar/estiver sem saldo, caímos para o Pollinations Server-Side (v5.1)
      return await handlePollinationsFallback(prompt);
    }

    const orData = await orResponse.json();
    const base64Image = orData.data?.[0]?.b64_json;

    if (!base64Image) {
      // Se não veio base64 mas veio URL, baixamos no servidor
      const imageUrl = orData.data?.[0]?.url;
      if (imageUrl) {
        return await fetchAndReturnBase64(imageUrl, "v6.0 URL-BRIDGE");
      }
      throw new Error("OpenRouter não retornou dados de imagem.");
    }

    console.log("✅ Imagem OpenRouter (DALL-E 3) recebida com sucesso.");

    return new Response(
      JSON.stringify({
        imageUrl: `data:image/png;base64,${base64Image}`,
        version: "v6.0 OPENROUTER"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("🚨 generate-photo v6.0 error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro crítico na v6.0" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function handlePollinationsFallback(prompt: string) {
  console.log("🔄 Usando Fallback Pollinations Server-Side...");
  const seed = Math.floor(Math.random() * 1000000);
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ", real estate professional photo, 4k")}?width=1024&height=1024&seed=${seed}&nologo=true`;
  return await fetchAndReturnBase64(pollinationsUrl, "v6.0 FALLBACK-BRIDGE");
}

async function fetchAndReturnBase64(url: string, versionPrefix: string) {
  const response = await fetch(url);
  const imageBuffer = await response.arrayBuffer();
  const base64Image = btoa(
    new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
  );
  return new Response(
    JSON.stringify({
      imageUrl: `data:image/png;base64,${base64Image}`,
      version: versionPrefix
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}
