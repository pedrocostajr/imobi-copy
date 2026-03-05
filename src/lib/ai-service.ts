import { CopyFormData, CopyResult, parseCopyResponse } from "./copy-types";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";
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

Tipo de imóvel: ${data.tipo}
Cidade: ${data.cidade}
Bairro: ${data.bairro}
${condicoesBlock}
Público-alvo: ${data.publico}
Diferencial principal: ${data.diferencial}
Estágio do imóvel: ${data.estagio}
Objetivo da campanha: ${data.objetivo}
Tom da comunicação: ${data.tom}

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
