import { useState, useRef } from "react";
import {
    Sparkles,
    Plus,
    Send,
    Zap,
    CheckCircle2,
    Tag,
    Star,
    Phone,
    Eraser,
    Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CopyResult } from "@/lib/copy-types";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface ManualCopyFormProps {
    onSave: (result: CopyResult) => void;
    initialData?: CopyResult | null;
}

const BLOCK_SUGGESTIONS = {
    abertura: [
        "🏠 Oportunidade imperdível no coração de [Bairro]!",
        "🚀 Lançamento exclusivo: viva onde você sempre sonhou.",
        "💎 Sofisticação e conforto em cada detalhe.",
        "✨ O seu novo capítulo começa aqui.",
        "📍 Localização privilegiada com vista panorâmica.",
    ],
    caracteristicas: [
        "✅ [X] dormitórios ([X] suítes)",
        "🚗 [X] vagas de garagem cobertas",
        "🏊‍♂️ Lazer completo: piscina, academia e salão de festas",
        "📐 [X]m² de área privativa muito bem distribuídos",
        "🛡️ Segurança 24h para sua tranquilidade",
    ],
    status: [
        "🔑 Pronto para morar!",
        "🏗️ Obras aceleradas!",
        "📅 Entrega prevista para [Mês/Ano]",
        "💰 Fluxo de pagamento facilitado",
        "📉 Valor abaixo do mercado por tempo limitado",
    ],
    gatilhos: [
        "🔥 Poucas unidades disponíveis!",
        "⏳ Condição especial por tempo limitado.",
        "💎 Unidade exclusiva com valor de pré-lançamento.",
        "🚀 Oportunidade única para investidores.",
        "📈 Região com alto potencial de valorização.",
    ],
    cta: [
        "📲 Clique no link da bio e agende sua visita!",
        "💬 Comente 'EU QUERO' para receber o material completo.",
        "👉 Saiba mais clicando no botão abaixo.",
        "📞 Entre em contato agora pelo WhatsApp: [Telefone]",
        "🔥 Agende sua visita hoje mesmo!",
    ],
    aida: [
        "🚨 ATENÇÃO: [Headline impactante]\n\n💡 INTERESSE: [Benefício principal do imóvel]\n\n💖 DESEJO: [Detalhe emocional/exclusivo]\n\n👉 AÇÃO: [Clique no botão abaixo]",
    ]
};

const EMOJIS = ["🏠", "🔑", "💎", "📍", "💰", "✨", "🚀", "🏊‍♂️", "🌳", "🏢", "🛋️", "🚗", "✅", "📲"];

const ManualCopyForm = ({ onSave, initialData }: ManualCopyFormProps) => {
    const { toast } = useToast();
    const [copyPrincipal, setCopyPrincipal] = useState(initialData?.copyPrincipal || "");
    const [headline, setHeadline] = useState(initialData?.headline || "");
    const [ctaRecomendado, setCtaRecomendado] = useState(initialData?.ctaRecomendado || "");

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const addText = (text: string, isBlock = true) => {
        setCopyPrincipal((prev) => {
            if (!isBlock) return prev + text;
            const separator = prev.length > 0 ? "\n" : "";
            return prev + separator + text;
        });
    };

    const clearCopy = () => {
        setCopyPrincipal("");
        toast({ title: "Texto limpo", description: "O campo da legenda foi esvaziado." });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const result: CopyResult = {
            copyPrincipal,
            headline: headline || "Oportunidade Imperdível",
            versaoResumida: copyPrincipal.substring(0, 100) + "...",
            mensagemWhatsapp: copyPrincipal,
            ctaRecomendado: ctaRecomendado || "Agende uma visita",
            roteiroReels: "",
            variacoesHeadline: [],
            variacoesCta: [],
        };

        onSave(result);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Builder Panel */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="glass-card rounded-xl p-5 border-primary/20 bg-primary/5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                <h3 className="font-display font-bold text-foreground">Montador de Legenda</h3>
                            </div>
                            <div className="flex gap-1 bg-background/50 p-1 rounded-lg border border-border/50">
                                {EMOJIS.slice(0, 7).map(e => (
                                    <button key={e} type="button" onClick={() => addText(e, false)} className="hover:scale-125 transition-transform px-1">{e}</button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-5">
                            <CategorySection title="Impacto Inicial" icon={<Zap className="h-4 w-4" />} suggestions={BLOCK_SUGGESTIONS.abertura} onAdd={addText} />
                            <CategorySection title="Diferenciais" icon={<CheckCircle2 className="h-4 w-4" />} suggestions={BLOCK_SUGGESTIONS.caracteristicas} onAdd={addText} />
                            <CategorySection title="Status & Preço" icon={<Tag className="h-4 w-4" />} suggestions={BLOCK_SUGGESTIONS.status} onAdd={addText} />
                            <CategorySection title="Gatilhos Mentais" icon={<Star className="h-4 w-4" />} suggestions={BLOCK_SUGGESTIONS.gatilhos} onAdd={addText} />
                            <CategorySection title="Chamadas (CTA)" icon={<Phone className="h-4 w-4" />} suggestions={BLOCK_SUGGESTIONS.cta} onAdd={addText} />

                            <div className="pt-2 border-t border-border/50">
                                <CategorySection title="Estrutura AIDA (Template)" icon={<LayoutIcon size={16} />} suggestions={BLOCK_SUGGESTIONS.aida} onAdd={addText} />
                            </div>
                        </div>
                    </div>

                    <div className="glass-card rounded-xl p-5">
                        <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Info className="h-4 w-4 text-muted-foreground" />
                            Dados Adicionais
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground ml-1">Headline Curta (para a arte)</Label>
                                <Input
                                    placeholder="Ex: O melhor da Vila Olímpia"
                                    value={headline}
                                    onChange={(e) => setHeadline(e.target.value)}
                                    className="bg-background/50 h-10"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground ml-1">CTA Curto (para o botão)</Label>
                                <Input
                                    placeholder="Ex: Saiba mais agora"
                                    value={ctaRecomendado}
                                    onChange={(e) => setCtaRecomendado(e.target.value)}
                                    className="bg-background/50 h-10"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Editor Panel */}
                <div className="lg:col-span-5 flex flex-col h-full">
                    <div className="glass-card rounded-xl p-6 border-accent/20 flex flex-col flex-1 gap-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                                    <LayoutIcon size={18} />
                                    Sua Legenda
                                </h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1 mr-2">
                                    {EMOJIS.slice(7).map(e => (
                                        <button key={e} type="button" onClick={() => addText(e, false)} className="hover:scale-125 transition-transform text-sm">{e}</button>
                                    ))}
                                </div>
                                <Button type="button" variant="ghost" size="sm" onClick={clearCopy} className="h-8 px-2 text-muted-foreground hover:text-destructive gap-1.5">
                                    <Eraser className="h-3.5 w-3.5" />
                                    Limpar
                                </Button>
                            </div>
                        </div>

                        <div className="relative flex-1 group">
                            <Textarea
                                ref={textareaRef}
                                value={copyPrincipal}
                                onChange={(e) => setCopyPrincipal(e.target.value)}
                                placeholder="Vá clicando nos blocos ao lado ou adicione emojis para montar sua legenda..."
                                className="w-full h-full min-h-[400px] lg:min-h-0 bg-background/30 border-dashed border-2 border-border/50 focus-visible:border-primary/50 text-base leading-relaxed p-4 resize-none"
                            />
                            <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Badge variant="outline" className="bg-background/80 backdrop-blur-sm shadow-sm border-primary/20 text-[10px] font-medium text-primary">
                                    {copyPrincipal.length} caracteres
                                </Badge>
                            </div>
                        </div>

                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!copyPrincipal.trim()}
                            className="w-full gradient-primary text-primary-foreground font-bold h-12 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 animate-pulse-glow"
                        >
                            <Send className="h-4 w-4" />
                            Visualizar Tudo Pronto
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
};

function CategorySection({ title, icon, suggestions, onAdd }: { title: string, icon: React.ReactNode, suggestions: string[], onAdd: (t: string, isBlock?: boolean) => void }) {
    return (
        <div className="space-y-2.5">
            <div className="flex items-center gap-2 px-1">
                <div className="text-primary">{icon}</div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => onAdd(s)}
                        className="text-left px-3 py-2 rounded-lg bg-background border border-border/50 hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.02] transition-all text-sm group flex items-start gap-2 max-w-full overflow-hidden"
                    >
                        <Plus className="h-3.5 w-3.5 mt-0.5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                        <span className="truncate">{s}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

function LayoutIcon({ size = 18 }: { size?: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><line x1="3" x2="21" y1="9" y2="9" /><line x1="9" x2="9" y1="21" y2="9" /></svg>
    );
}

export default ManualCopyForm;
