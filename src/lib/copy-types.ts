export interface CopyFormData {
  tipo: string;
  cidade: string;
  bairro: string;
  valor: string;
  valorPersonalizado: string;
  temEntrada: boolean;
  entrada: string;
  parcelas: string;
  publico: string;
  diferencial: string;
  estagio: string;
  objetivo: string;
  tom: string;
  modoAvancado: boolean;
}

export interface CopyResult {
  copyPrincipal: string;
  headline: string;
  versaoResumida: string;
  mensagemWhatsapp: string;
  ctaRecomendado: string;
  roteiroReels?: string;
  variacoesHeadline?: string[];
  variacoesCta?: string[];
}

export function parseCopyResponse(content: string): CopyResult {
  const lines = content.split("\n");

  // Dynamic blocks to find
  const markers = [
    { key: "copyPrincipal", labels: ["COPY PRINCIPAL"] },
    { key: "headline", labels: ["HEADLINE PARA IMAGEM", "HEADLINE"] },
    { key: "versaoResumida", labels: ["VERSÃO RESUMIDA", "VERSAO RESUMIDA"] },
    { key: "mensagemWhatsapp", labels: ["MENSAGEM WHATSAPP", "MENSAGEM DO WHATSAPP"] },
    { key: "ctaRecomendado", labels: ["CTA RECOMENDADO", "CTA"] },
    { key: "roteiroReels", labels: ["ROTEIRO PARA REELS", "ROTEIRO REELS"] },
    { key: "variacoesHeadline", labels: ["VARIAÇÕES DE HEADLINE", "VARIACOES DE HEADLINE"] },
    { key: "variacoesCta", labels: ["VARIAÇÕES DE CTA", "VARIACOES DE CTA"] },
  ];

  const sections: Record<string, string[]> = {};
  let currentKey = "";

  for (const line of lines) {
    const upperLine = line.trim().toUpperCase();

    // Find if this line contains any of our markers
    const foundMarker = markers.find(m =>
      m.labels.some(label => upperLine.includes(label))
    );

    if (foundMarker) {
      currentKey = foundMarker.key;
      sections[currentKey] = [];

      // Try to capture content on the same line after potential ":"
      const parts = line.split(/:\s*/);
      if (parts.length > 1) {
        const afterColon = parts.slice(1).join(":").trim();
        // Only take it if it's not actually another marker
        if (afterColon && !markers.some(m => m.labels.some(l => afterColon.toUpperCase().includes(l)))) {
          sections[currentKey].push(afterColon);
        }
      }
    } else if (currentKey) {
      sections[currentKey].push(line);
    }
  }

  // Helper to get text from section
  const getSectionText = (key: string): string => {
    return (sections[key] || []).join("\n").trim();
  };

  const parseList = (linesList: string[] | undefined): string[] => {
    if (!linesList) return [];
    return linesList
      .map(l => l.trim())
      .map(l => l.replace(/^[-*•\d+.]\s*/, "").trim())
      .filter(l => l.length > 0 && !l.startsWith("###") && !l.startsWith("---"));
  };

  return {
    copyPrincipal: getSectionText("copyPrincipal"),
    headline: getSectionText("headline"),
    versaoResumida: getSectionText("versaoResumida"),
    mensagemWhatsapp: getSectionText("mensagemWhatsapp"),
    ctaRecomendado: getSectionText("ctaRecomendado"),
    roteiroReels: getSectionText("roteiroReels"),
    variacoesHeadline: parseList(sections["variacoesHeadline"]),
    variacoesCta: parseList(sections["variacoesCta"]),
  };
}

export const TIPO_OPTIONS = [
  "Alto padrão",
  "Minha Casa Minha Vida",
  "Lançamento",
  "Terreno",
  "Investimento",
  "Comercial",
];

export const VALOR_OPTIONS = [
  "Até 300k",
  "300k – 800k",
  "800k – 2M",
  "+2M",
  "Personalizado",
];

export const PARCELAS_OPTIONS = [
  "À vista",
  "12x",
  "24x",
  "36x",
  "48x",
  "60x",
  "120x",
  "Direto com construtora",
];

export const PUBLICO_OPTIONS = [
  "Família",
  "Investidor",
  "Casal jovem",
  "Aposentado",
  "Empresário",
];

export const ESTAGIO_OPTIONS = [
  "Lançamento",
  "Em obras",
  "Pronto",
  "Revenda",
];

export const OBJETIVO_OPTIONS = [
  "Gerar leads",
  "Agendar visita",
  "Lista VIP",
  "WhatsApp direto",
];

export const TOM_OPTIONS = [
  "Direto e vendedor",
  "Sofisticado e premium",
  "Técnico e racional",
  "Emocional e aspiracional",
];
