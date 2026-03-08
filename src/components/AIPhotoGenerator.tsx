import { useState, useRef, useEffect } from "react";
import { Camera, Download, Sparkles, Loader2, ExternalLink, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateImage } from "@/lib/ai-service";
import { useToast } from "@/hooks/use-toast";

const PRESETS = [
  {
    label: "Sala de estar moderna",
    prompt:
      "Ultra-realistic professional real estate photography of a modern living room with natural light, minimalist furniture, hardwood floors, large windows, warm tones, 4K quality, editorial style",
  },
  {
    label: "Quarto luxuoso",
    prompt:
      "Ultra-realistic professional interior photography of a luxurious master bedroom with king bed, soft lighting, neutral palette, elegant curtains, high-end finishes, 4K quality",
  },
  {
    label: "Cozinha planejada",
    prompt:
      "Ultra-realistic professional real estate photo of a modern planned kitchen with marble countertops, stainless steel appliances, pendant lights, clean design, warm lighting, 4K",
  },
  {
    label: "Fachada residencial",
    prompt:
      "Ultra-realistic professional exterior photography of a modern residential house facade, landscaped garden, blue sky, warm golden hour lighting, clean architecture, 4K quality",
  },
  {
    label: "Área de lazer / Piscina",
    prompt:
      "Ultra-realistic professional real estate photography of a luxury pool area with lounge chairs, tropical landscaping, sunset lighting, modern architecture, 4K quality",
  },
  {
    label: "Banheiro sofisticado",
    prompt:
      "Ultra-realistic professional interior photography of a sophisticated bathroom with freestanding bathtub, marble surfaces, modern fixtures, warm ambient lighting, 4K quality",
  },
];

const AIPhotoGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  const loadingRef = useRef(false);
  const watchdogRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
      if (fallbackRef.current) clearTimeout(fallbackRef.current);
    };
  }, []);

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    const preset = PRESETS.find((p) => p.label === value);
    if (preset) setPrompt(preset.prompt);
  };

  const stopLoading = () => {
    setIsLoading(false);
    loadingRef.current = false;
    setShowFallback(false);
    if (watchdogRef.current) clearTimeout(watchdogRef.current);
    if (fallbackRef.current) clearTimeout(fallbackRef.current);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Descreva o imóvel ou ambiente", variant: "destructive" });
      return;
    }

    stopLoading();
    setIsLoading(true);
    loadingRef.current = true;
    setGeneratedImage(null);

    try {
      const imageUrl = await generateImage(prompt);

      fallbackRef.current = setTimeout(() => {
        if (loadingRef.current) setShowFallback(true);
      }, 3000); // 3 seconds to show help

      watchdogRef.current = setTimeout(() => {
        if (loadingRef.current) {
          stopLoading();
          toast({
            title: "Timeout do Servidor (v2.6)",
            description: "A imagem pode estar pronta mas o painel não carregou. Use os links de emergência.",
            variant: "destructive"
          });
          setGeneratedImage(imageUrl);
        }
      }, 45000);

      setGeneratedImage(imageUrl);
      toast({ title: "Iniciando geração (v2.6)..." });
    } catch (err: any) {
      console.error("🚨 Erro v2.6:", err);
      stopLoading();
      toast({
        title: "Erro na conexão v2.6",
        description: err.message || "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "URL copiada!", description: "Cole em uma nova aba para testar." });
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement("a");
    link.download = `foto-ia-${Date.now()}.png`;
    link.href = generatedImage;
    link.click();
    toast({ title: "Foto baixada!" });
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="font-display text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
            <Camera className="h-[18px] w-[18px] text-primary" />
            Estúdio de Fotos IA
          </h2>
          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">v2.6 stable</span>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-6 flex items-center gap-3">
          <div className="bg-amber-500/20 p-1.5 rounded-md">
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-500">Recurso em Atualização (v2.6)</p>
            <p className="text-xs text-amber-500/80">Se a imagem não carregar no visor, use os botões de emergência que aparecerão abaixo.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-foreground mb-1.5 block">Preset rápido</Label>
              <Select value={selectedPreset} onValueChange={handlePresetChange}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Escolha um ambiente..." />
                </SelectTrigger>
                <SelectContent>
                  {PRESETS.map((p) => (
                    <SelectItem key={p.label} value={p.label}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm text-foreground mb-1.5 block">Descrição detalhada</Label>
              <Textarea
                placeholder="Ex: Sala de estar moderna com luz natural..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-background min-h-[140px]"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              className="w-full gradient-primary text-primary-foreground font-semibold gap-2 rounded-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando foto...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Gerar Foto com IA
                </>
              )}
            </Button>

            {showFallback && generatedImage && (
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={generatedImage}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 p-3 text-[10px] font-bold text-amber-600 bg-amber-50 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors"
                  onClick={() => stopLoading()}
                >
                  <ExternalLink className="h-3 w-3" />
                  Abrir link direto
                </a>
                <button
                  onClick={() => copyToClipboard(generatedImage)}
                  className="flex items-center justify-center gap-2 p-3 text-[10px] font-bold text-blue-600 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  <Copy className="h-3 w-3" />
                  Copiar URL
                </button>
              </div>
            )}

            {generatedImage && !isLoading && (
              <Button onClick={handleDownload} variant="outline" className="w-full gap-2">
                <Download className="h-4 w-4" />
                Baixar Foto em Alta Resolução
              </Button>
            )}
          </div>

          <div className="flex flex-col items-center justify-center">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Resultado
            </p>
            <div className="border border-border rounded-lg overflow-hidden shadow-xl bg-muted/30 flex items-center justify-center w-full min-h-[300px] max-h-[520px] relative">
              {isLoading && (
                <div className="absolute inset-0 z-10 bg-muted/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-8 text-muted-foreground">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm font-medium">Gerando sua foto...</p>
                  <p className="text-[10px] text-center max-w-[200px]">Isso pode levar até 1 minuto.</p>
                </div>
              )}

              {generatedImage ? (
                <img
                  src={generatedImage}
                  alt="Foto gerada por IA"
                  onLoad={() => stopLoading()}
                  onError={() => {
                    stopLoading();
                    toast({
                      title: "Erro no carregador (v2.6)",
                      description: "Use o botão de 'Copiar URL' para testar se a IA gerou a imagem.",
                      variant: "destructive"
                    });
                  }}
                  className={`block w-full h-auto max-h-[500px] object-contain transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                />
              ) : !isLoading && (
                <div className="flex flex-col items-center gap-2 p-8 text-muted-foreground">
                  <Camera className="h-10 w-10 opacity-30" />
                  <p className="text-sm">Sua foto aparecerá aqui</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPhotoGenerator;
