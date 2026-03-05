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
    const { tipo, cidade, bairro, valor, valorPersonalizado, temEntrada, entrada, parcelas, publico, diferencial, estagio, objetivo, tom, modoAvancado } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const valorFinal = valor === "Personalizado" ? valorPersonalizado : valor;

    let condicoesBlock = `Faixa de valor: ${valorFinal}`;
    if (temEntrada && entrada) {
      condicoesBlock += `\nEntrada: ${entrada}`;
    }
    if (parcelas) {
      condicoesBlock += `\nParcelamento do saldo: ${parcelas}`;
    }

    const advancedBlock = modoAvancado
      ? `

Além disso, como o modo avançado está ativado, gere também:

VARIAÇÕES DE HEADLINE:
1. (headline alternativa 1)
2. (headline alternativa 2)
3. (headline alternativa 3)

VARIAÇÕES DE CTA:
1. (CTA alternativo 1)
2. (CTA alternativo 2)

ROTEIRO PARA REELS:
Crie um roteiro de 30 segundos para Reels/TikTok seguindo esta estrutura:
- QUEBRA DE PADRÃO (0-3s): Frase curta e impactante que prende atenção
- CONEXÃO COM DOR/DESEJO (3-8s): Faça o espectador se identificar
- APRESENTAÇÃO DA SOLUÇÃO (8-18s): Mostre o imóvel como a resposta
- PROVA/CONCRETEZA (18-23s): Dados reais, localização, diferenciais
- CTA FORTE (23-30s): Chamada direta para cadastro ou WhatsApp
Formato: escreva cada cena com indicação de tempo e texto de narração.`
      : "";

    const systemPrompt = `Você é um copywriter especialista em mercado imobiliário brasileiro, treinado em técnicas de quebra de padrão, AIDA e gatilhos mentais para gerar cadastros e conversões reais.

Crie uma copy altamente persuasiva para Meta Ads com base nos seguintes dados:

Tipo de imóvel: ${tipo}
Cidade: ${cidade}
Bairro: ${bairro}
${condicoesBlock}
Público-alvo: ${publico}
Diferencial principal: ${diferencial}
Estágio do imóvel: ${estagio}
Objetivo da campanha: ${objetivo}
Tom da comunicação: ${tom}

Regras obrigatórias:
- Use estrutura AIDA adaptada para imóveis.
- Comece SEMPRE com uma frase de quebra de padrão nos primeiros 3 segundos de leitura (pergunta provocativa, afirmação contraintuitiva ou situação que dói no bolso).
- Linguagem natural e profissional.
- Não usar promessas irreais.
- Evitar clichês exagerados.
- Incluir CTA claro e estratégico orientando o próximo passo (nunca usar "saiba mais" sozinho).
- Texto principal com no máximo 1200 caracteres.
- Adaptar linguagem ao público selecionado.
- Se houver informações de entrada e parcelamento, incluí-las na copy de forma persuasiva.
- Se for alto padrão, enfatizar exclusividade e diferenciação.
- Se for investimento, enfatizar valorização e oportunidade.
- Se for Minha Casa Minha Vida, enfatizar facilidade e segurança.

Organize a resposta EXATAMENTE neste formato (mantenha os títulos em maiúscula seguidos de dois pontos):

COPY PRINCIPAL:
(texto da copy principal)

HEADLINE PARA IMAGEM:
(máximo 8 palavras)

VERSÃO RESUMIDA:
(até 300 caracteres)

MENSAGEM WHATSAPP:
(texto de abordagem após o clique)

CTA RECOMENDADO:
(curto e direto)${advancedBlock}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-1.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Gere a copy agora com base nas informações fornecidas." },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar copy. Tente novamente." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-copy error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
