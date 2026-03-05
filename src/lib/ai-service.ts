import { CopyFormData, CopyResult, parseCopyResponse } from "./copy-types";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";
// Fallback key used only if VITE_GEMINI_API_KEY is not found in .env
const FALLBACK_KEY = "AIzaSyBqhqJhfS0C6EDVd2MzpY7eALDIoHRkwKI";

export async function generateCopy(data: CopyFormData): Promise<CopyResult> {
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || FALLBACK_KEY;

    if (!GEMINI_API_KEY || GEMINI_API_KEY === "COLOQUE_SUA_CHAVE_AQUI") {
        throw new Error("Chave da API do Gemini não configurada.");
    }

    const valorFinal = data.valor === "Personalizado" ? data.valorPersonalizado : data.valor;

    let condicoesBlock = `Faixa de valor: ${valorFinal}`;
    if (data.temEntrada && data.entrada) {
        condicoesBlock += `\nEntrada: ${data.entrada}`;
    }
    if (data.parcelas) {
        condicoesBlock += `\nParcelamento do saldo: ${data.parcelas}`;
    }

    const advancedBlock = data.modoAvancado
        ? `
### INSTRUÇÕES ADICIONAIS (MODO AVANÇADO ATIVADO) ###

1. VARIAÇÕES DE HEADLINE: 
Gere 3 variações curtas e impactantes (máximo 10 palavras cada) que foquem em diferentes ângulos:
- Ângulo 1: Focado em Benefício/Diferencial
- Ângulo 2: Focado em Escassez/Oportunidade
- Ângulo 3: Focado em Curiosidade

2. VARIAÇÕES DE CTA:
Gere 2 CTAs alternativos que incentivem a ação imediata.

3. ROTEIRO PARA REELS (30 SEGUNDOS):
Crie um roteiro cinematográfico e dinâmico dividido exatamente assim:
- [00-03s] GANCHO: Uma frase de impacto visual ou falada que interrompa o scroll.
- [03-10s] PROBLEMA/DESEJO: Toque na ferida ou no sonho do público ${data.publico}.
- [10-20s] SOLUÇÃO: Como este imóvel em ${data.bairro} resolve isso.
- [20-25s] AUTORIDADE/PROVA: Destaque o diferencial: ${data.diferencial}.
- [25-30s] CHAMADA PARA AÇÃO: Comando claro para o objetivo "${data.objetivo}".
Instrução: descreva a "Cena" (o que aparece) e o "Áudio" (o que é dito).`
        : "";

    const systemPrompt = `Você é um Copywriter Sênior de Alta Performance, especializado no mercado imobiliário brasileiro e em neuro-vendas para Meta Ads (Facebook/Instagram). Sua missão é gerar uma copy de conversão nível "Agência Premium".

DADOS DO PROJETO:
- Produto: ${data.tipo} em ${data.cidade}/${data.bairro}
- Estágio: ${data.estagio}
- Valor: ${valorFinal}
- Condições: ${data.temEntrada ? `Entrada de ${data.entrada}` : "Sob consulta"} | ${data.parcelas ? `Parcelamento: ${data.parcelas}` : ""}
- Público: ${data.publico}
- Diferencial: ${data.diferencial}
- Objetivo: ${data.objetivo}
- Tom: ${data.tom}

SUA ESTRUTURA DE RESPOSTA (OBRIGATÓRIA):

COPY PRINCIPAL:
[Crie um texto persuasivo usando a estrutura AIDA. Use emojis de forma profissional. Comece com uma 'Quebra de Padrão' poderosa que não pareça anúncio comum. No meio, incorpore os dados de valor e condições de forma que pareçam uma oportunidade única. Termine com um CTA irresistível ligado ao objetivo ${data.objetivo}.]

HEADLINE PARA IMAGEM:
[Uma frase curta, de no máximo 8 palavras, que complemente a imagem e gere clique imediato.]

VERSÃO RESUMIDA:
[Um parágrafo de até 300 caracteres focado apenas no benefício central e CTA.]

MENSAGEM WHATSAPP:
[Um texto de primeira abordagem para o lead enviar, já demonstrando interesse específico no imóvel de ${data.bairro}.]

CTA RECOMENDADO:
[O texto exato que deve ir no botão do anúncio (ex: Cadastre-se, Saiba Mais, Enviar Mensagem).]

${advancedBlock}

REGRAS DE OURO:
- Proibido usar "Venha conhecer o seu novo lar" ou clichês vazios.
- Foque em transformar as características em benefícios reais.
- Se o público for "Investidor", fale de TIR, ROI e liquidez.
- Se for "Família", fale de segurança, espaço e memórias.
- Use parágrafos curtos e bullet points para facilitar a leitura no celular.
- A resposta deve seguir RIGOROSAMENTE as etiquetas em maiúsculas acima para o processamento de texto.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        { text: systemPrompt },
                        { text: "Gere a copy agora com base nas informações fornecidas." }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Gemini API Error:", errorData);
        throw new Error(errorData.error?.message || "Erro ao gerar copy com Gemini");
    }

    const resultData = await response.json();
    const content = resultData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return parseCopyResponse(content);
}
