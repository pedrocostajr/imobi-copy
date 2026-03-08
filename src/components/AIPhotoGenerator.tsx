import { useState, useRef, useEffect } from "react";
import { Camera, Download, Sparkles, Loader2, ExternalLink } from "lucide-react";
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

  // Refs para garantir que o watchdog e eventos acessam o estado atualizado
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

    // Reset states
    stopLoading();
    setIsLoading(true);
    loadingRef.current = true;
    setGeneratedImage(null);

    try {
      const imageUrl = await generateImage(prompt);

      // Timer para mostrar o link manual após 5 segundos
      fallbackRef.current = setTimeout(() => {
        if (loadingRef.current) setShowFallback(true);
      }, 5000);

      // Watchdog de 60 segundos (v2.5)
      watchdogRef.current = setTimeout(() => {
        if (loadingRef.current) {
          stopLoading();
          toast({
            title: "O servidor demorou muito (v2.5)",
            description: "A imagem pode estar pronta mas seu navegador não a carregou. Tente abrir o link direto abaixo.",
            variant: "destructive"
          });
          // Força a exibição do link mesmo que tenha dado timeout
          setGeneratedImage(imageUrl);
        }
      }, 60000);

      // Seta a imagem diretamente no src do <img>
      setGeneratedImage(imageUrl);

      toast({ title: "Iniciando geração (v2.5)..." });
    } catch (err: any) {
      console.error("🚨 Erro v2.5:", err);
      stopLoading();
      toast({
        title: "Erro na conexão v2.5",
        description: err.message || "Verifique sua internet.",
        variant: "destructive",
      });
    }
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
          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">v2.5 stable</span>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-6 flex items-center gap-3">
          <div className="bg-amber-500/20 p-1.5 rounded-md">
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-500">Recurso em Atualização (v2.5)</p>
            <p className="text-xs text-amber-500/80">Otimizamos o gerador para maior velocidade. Se travar, clique no link direto que aparecerá.</p>
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
              <a
                href={generatedImage}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 p-3 text-xs font-semibold text-amber-600 bg-amber-50 rounded-lg border border-amber-200 animate-pulse hover:bg-amber-100 transition-colors"
                onClick={() => stopLoading()}
              >
                <ExternalLink className="h-4 w-4" />
                A imagem está demorando? Clique aqui para abrir diretamente
              </a>
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
                  <p className="text-[10px] text-center max-w-[200px]">Se demorar mais de 10s, use o link de emergência ao lado.</p>
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
                      title: "Erro ao carregar (v2.5)",
                      description: "Tente abrir o link direto ou recarregar a página.",
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
