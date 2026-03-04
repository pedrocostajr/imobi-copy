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
  const sections: Record<string, string> = {};
  const lines = content.split("\n");
  let currentKey = "";
  let currentContent: string[] = [];

  for (const line of lines) {
    const cleanLine = line.replace(/\*\*/g, "").trim();
    const headerMatch = cleanLine.match(/^(COPY PRINCIPAL|HEADLINE PARA IMAGEM|VERS[ÃA]O RESUMIDA|MENSAGEM WHATSAPP|CTA RECOMENDADO|ROTEIRO PARA REELS|VARIA[ÇC][ÕO]ES DE HEADLINE|VARIA[ÇC][ÕO]ES DE CTA):\s*(.*)/i);
    if (headerMatch) {
      if (currentKey) {
        sections[currentKey] = currentContent.join("\n").trim();
      }
      currentKey = headerMatch[1].toUpperCase();
      currentContent = headerMatch[2] ? [headerMatch[2]] : [];
    } else if (currentKey) {
      currentContent.push(line);
    }
  }
  if (currentKey) {
    sections[currentKey] = currentContent.join("\n").trim();
  }

  const parseList = (text: string | undefined): string[] => {
    if (!text) return [];
    return text
      .split("\n")
      .map((l) => l.replace(/^\d+\.\s*/, "").trim())
      .filter(Boolean);
  };

  return {
    copyPrincipal: sections["COPY PRINCIPAL"] || "",
    headline: sections["HEADLINE PARA IMAGEM"] || "",
    versaoResumida: sections["VERSÃO RESUMIDA"] || "",
    mensagemWhatsapp: sections["MENSAGEM WHATSAPP"] || "",
    ctaRecomendado: sections["CTA RECOMENDADO"] || "",
    roteiroReels: sections["ROTEIRO PARA REELS"] || "",
    variacoesHeadline: parseList(sections["VARIAÇÕES DE HEADLINE"]),
    variacoesCta: parseList(sections["VARIAÇÕES DE CTA"]),
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
