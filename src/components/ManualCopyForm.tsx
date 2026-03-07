import { useState } from "react";
import { Save, Layout, FileText, Smartphone, Send, Type, Video, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CopyResult } from "@/lib/copy-types";

interface ManualCopyFormProps {
    onSave: (result: CopyResult) => void;
    initialData?: CopyResult | null;
}

const ManualCopyForm = ({ onSave, initialData }: ManualCopyFormProps) => {
    const [formData, setFormData] = useState<CopyResult>(
        initialData || {
            copyPrincipal: "",
            headline: "",
            versaoResumida: "",
            mensagemWhatsapp: "",
            ctaRecomendado: "",
            roteiroReels: "",
            variacoesHeadline: [],
            variacoesCta: [],
        }
    );

    const [newHeadline, setNewHeadline] = useState("");
    const [newCta, setNewCta] = useState("");

    const updateField = (field: keyof CopyResult, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const addVariation = (field: 'variacoesHeadline' | 'variacoesCta', value: string, setter: (v: string) => void) => {
        if (!value.trim()) return;
        setFormData((prev) => ({
            ...prev,
            [field]: [...(prev[field] || []), value.trim()],
        }));
        setter("");
    };

    const removeVariation = (field: 'variacoesHeadline' | 'variacoesCta', index: number) => {
        setFormData((prev) => ({
            ...prev,
            [field]: (prev[field] || []).filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
            {/* Essential Copy Blocks */}
            <div className="glass-card rounded-xl p-6">
                <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <FileText className="h-[18px] w-[18px] text-primary" />
                    Conteúdo Essencial
                </h2>
                <div className="space-y-4">
                    <div>
                        <Label className="text-sm text-foreground mb-1.5 block">Copy Principal *</Label>
                        <Textarea
                            placeholder="Escreva o texto principal do anúncio..."
                            value={formData.copyPrincipal}
                            onChange={(e) => updateField("copyPrincipal", e.target.value)}
                            className="bg-background min-h-[120px]"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-sm text-foreground mb-1.5 block">Headline para Imagem *</Label>
                            <Input
                                placeholder="Ex: Oportunidade Única na Vila Olímpia"
                                value={formData.headline}
                                onChange={(e) => updateField("headline", e.target.value)}
                                className="bg-background"
                                required
                            />
                        </div>
                        <div>
                            <Label className="text-sm text-foreground mb-1.5 block">CTA Recomendado *</Label>
                            <Input
                                placeholder="Ex: Clique em Saiba Mais"
                                value={formData.ctaRecomendado}
                                onChange={(e) => updateField("ctaRecomendado", e.target.value)}
                                className="bg-background"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <Label className="text-sm text-foreground mb-1.5 block">Versão Resumida</Label>
                        <Textarea
                            placeholder="Uma versão curta para descrições rápidas..."
                            value={formData.versaoResumida}
                            onChange={(e) => updateField("versaoResumida", e.target.value)}
                            className="bg-background min-h-[80px]"
                        />
                    </div>

                    <div>
                        <Label className="text-sm text-foreground mb-1.5 block flex items-center gap-1.5">
                            <Smartphone className="h-3.5 w-3.5" />
                            Mensagem WhatsApp
                        </Label>
                        <Textarea
                            placeholder="Texto pronto para enviar no WhatsApp..."
                            value={formData.mensagemWhatsapp}
                            onChange={(e) => updateField("mensagemWhatsapp", e.target.value)}
                            className="bg-background min-h-[80px]"
                        />
                    </div>
                </div>
            </div>

            {/* Advanced Content */}
            <div className="glass-card rounded-xl p-6">
                <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Layout className="h-[18px] w-[18px] text-accent" />
                    Conteúdo Avançado (Opcional)
                </h2>
                <div className="space-y-6">
                    <div>
                        <Label className="text-sm text-foreground mb-1.5 block flex items-center gap-1.5">
                            <Video className="h-3.5 w-3.5" />
                            Roteiro para Reels
                        </Label>
                        <Textarea
                            placeholder="Cena 1: Mostre a fachada... Cena 2: ..."
                            value={formData.roteiroReels}
                            onChange={(e) => updateField("roteiroReels", e.target.value)}
                            className="bg-background min-h-[120px]"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Variations Headline */}
                        <div className="space-y-3">
                            <Label className="text-sm text-foreground block">Variações de Headline</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Nova headline..."
                                    value={newHeadline}
                                    onChange={(e) => setNewHeadline(e.target.value)}
                                    className="bg-background h-9 text-xs"
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addVariation('variacoesHeadline', newHeadline, setNewHeadline))}
                                />
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => addVariation('variacoesHeadline', newHeadline, setNewHeadline)}
                                    className="h-9 w-9 p-0"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {formData.variacoesHeadline?.map((h, i) => (
                                    <div key={i} className="flex items-center justify-between gap-2 p-2 rounded bg-muted/50 border border-border text-xs">
                                        <span className="truncate flex-1">{h}</span>
                                        <button type="button" onClick={() => removeVariation('variacoesHeadline', i)} className="text-muted-foreground hover:text-destructive">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Variations CTA */}
                        <div className="space-y-3">
                            <Label className="text-sm text-foreground block">Variações de CTA</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Novo CTA..."
                                    value={newCta}
                                    onChange={(e) => setNewCta(e.target.value)}
                                    className="bg-background h-9 text-xs"
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addVariation('variacoesCta', newCta, setNewCta))}
                                />
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => addVariation('variacoesCta', newCta, setNewCta)}
                                    className="h-9 w-9 p-0"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {formData.variacoesCta?.map((c, i) => (
                                    <div key={i} className="flex items-center justify-between gap-2 p-2 rounded bg-muted/50 border border-border text-xs">
                                        <span className="truncate flex-1">{c}</span>
                                        <button type="button" onClick={() => removeVariation('variacoesCta', i)} className="text-muted-foreground hover:text-destructive">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-center pt-4">
                <Button
                    type="submit"
                    className="gradient-primary text-primary-foreground font-semibold px-12 py-4 h-auto text-lg rounded-xl shadow-lg hover:shadow-xl transition-all w-full md:w-auto flex items-center gap-3 animate-pulse-glow"
                >
                    <Send className="h-5 w-5" />
                    Visualizar Resultado Manual
                </Button>
            </div>
        </form>
    );
};

export default ManualCopyForm;
