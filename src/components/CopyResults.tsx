import { useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyResult } from "@/lib/copy-types";
import { useToast } from "@/hooks/use-toast";

interface CopyResultsProps {
  result: CopyResult;
  onRegenerate: () => void;
}

const CopyResults = ({ result, onRegenerate }: CopyResultsProps) => {
  const blocks = [
    { title: "📝 Copy Principal", content: result.copyPrincipal },
    { title: "🎯 Headline para Imagem", content: result.headline },
    { title: "📋 Versão Resumida", content: result.versaoResumida },
    { title: "📱 Mensagem WhatsApp", content: result.mensagemWhatsapp },
    { title: "🔥 CTA Recomendado", content: result.ctaRecomendado },
  ];

  if (result.roteiroReels) {
    blocks.push({ title: "🎬 Roteiro para Reels", content: result.roteiroReels });
  }

  const advancedBlocks = [];
  if (result.variacoesHeadline?.length) {
    advancedBlocks.push({
      title: "💎 Variações de Headline",
      content: result.variacoesHeadline.map((h, i) => `${i + 1}. ${h}`).join("\n"),
    });
  }
  if (result.variacoesCta?.length) {
    advancedBlocks.push({
      title: "💎 Variações de CTA",
      content: result.variacoesCta.map((c, i) => `${i + 1}. ${c}`).join("\n"),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-foreground">
          Resultado
        </h2>
        <Button variant="outline" size="sm" onClick={onRegenerate} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Gerar Nova Versão
        </Button>
      </div>

      {blocks.map((block) => (
        <CopyBlock key={block.title} title={block.title} content={block.content} />
      ))}

      {advancedBlocks.length > 0 && (
        <>
          <div className="border-t border-border pt-4 mt-6">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">
              Modo Avançado
            </p>
          </div>
          {advancedBlocks.map((block) => (
            <CopyBlock key={block.title} title={block.title} content={block.content} />
          ))}
        </>
      )}
    </div>
  );
};

function CopyBlock({ title, content }: { title: string; content: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast({ title: "Copiado!", description: "Texto copiado para a área de transferência." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" });
    }
  };

  if (!content) return null;

  return (
    <div className="glass-card rounded-xl p-5 group">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-display text-sm font-semibold text-foreground">{title}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="shrink-0 h-8 px-3 text-xs gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-success" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copiar
            </>
          )}
        </Button>
      </div>
      <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{content}</p>
    </div>
  );
}

export default CopyResults;
