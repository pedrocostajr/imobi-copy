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
### SEÇÕES ADICIONAIS (MODO AVANÇADO ATIVADO) ###

VARIAÇÕES DE HEADLINE: 
Gere exatamente 3 headlines alternativas extras (curtas e impactantes):
1. [Headline foque em curiosidade]
2. [Headline foque em urgência]
3. [Headline foque em benefício prático]

VARIAÇÕES DE CTA:
Gere exatamente 2 CTAs alternativos curtos e diretos:
1. [CTA alternativo 1]
2. [CTA alternativo 2]

ROTEIRO PARA REELS (30 SEGUNDOS):
Crie um roteiro dinâmico e visual. Divida em:
- [00-05s] GANCHO: O que falar e o que mostrar para prender o scroll.
- [05-15s] REVELAÇÃO: Detalhes do imóvel (${data.tipo}) e localização (${data.bairro}).
- [15-25s] DIFERENCIAL: Por que este imóvel é único (${data.diferencial}).
- [25-30s] CHAMADA FINAL: O que o espectador deve fazer agora.`
        : "";

    const systemPrompt = `Você é um Copywriter Sênior de Alta Performance, focado em conversão extrema para o mercado imobiliário.

DADOS DO IMÓVEL:
- Tipo: ${data.tipo} em ${data.cidade}/${data.bairro}
- Estágio: ${data.estagio}
- Valor e Condições: ${valorFinal} | ${data.temEntrada ? `Entrada de ${data.entrada}` : ""} | ${data.parcelas ? `Parcelas: ${data.parcelas}` : ""}
- Público: ${data.publico}
- Diferencial: ${data.diferencial}
- Objetivo: ${data.objetivo}
- Tom: ${data.tom}

### INSTRUÇÕES OBRIGATÓRIAS ###
1. COPY PRINCIPAL: Escreva uma copy persuasiva (AIDA). 
   - ATENÇÃO: É PROIBIDO incluir os rótulos "Atenção:", "Interesse:", "Desejo:" ou "Ação:" no texto. O texto deve ser fluido e pronto para copiar e colar.
   - Use parágrafos curtos, emojis estratégicos e um CTA forte ao final ligado ao objetivo "${data.objetivo}".

2. HEADLINE PARA IMAGEM: Uma frase curta (máximo 8 palavras) para o criativo.

3. VERSÃO RESUMIDA: Um texto curto (até 280 caracteres) para legendas rápidas ou Stories.

4. MENSAGEM WHATSAPP: O texto que o cliente enviará ao iniciar o contato.

5. CTA RECOMENDADO: O texto curto para o botão do anúncio.

FORMATO DE RESPOSTA (MANTENHA OS TÍTULOS ABAIXO EXATAMENTE ASSIM):

COPY PRINCIPAL:
[Texto aqui]

HEADLINE PARA IMAGEM:
[Texto aqui]

VERSÃO RESUMIDA:
[Texto aqui]

MENSAGEM WHATSAPP:
[Texto aqui]

CTA RECOMENDADO:
[Texto aqui]

${advancedBlock}

REGRAS DE OURO:
- Sem clichês imobiliários como "seu sonho começa aqui".
- Se for Minha Casa Minha Vida, foque em facilidade e parcelas.
- Se for Alto Padrão ou Investidor, foque em localização, exclusividade e ROI.
- A resposta deve ser limpa, sem comentários extras além das seções solicitadas.`;

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
