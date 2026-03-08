import { useState } from "react";
import { Camera, Download, Sparkles, Loader2 } from "lucide-react";
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
  const { toast } = useToast();

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    const preset = PRESETS.find((p) => p.label === value);
    if (preset) setPrompt(preset.prompt);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Descreva o imóvel ou ambiente", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setGeneratedImage(null);

    try {
      const imageUrl = await generateImage(prompt);

      // Pre-carregamento da imagem para manter o loader ativo até estar pronta
      // Adicionado timeout de 20s para evitar travamento infinito
      await Promise.race([
        new Promise((resolve, reject) => {
          const img = new Image();
          img.src = imageUrl;
          img.onload = resolve;
          img.onerror = () => reject(new Error("Erro ao carregar a imagem gerada."));
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Tempo limite excedido ao carregar a imagem. Tente novamente.")), 20000)
        )
      ]);

      setGeneratedImage(imageUrl);
      toast({ title: "Foto gerada com sucesso!" });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Erro ao gerar foto",
        description: err.message || "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
        <h2 className="font-display text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
          <Camera className="h-[18px] w-[18px] text-primary" />
          Estúdio de Fotos IA
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Descreva o imóvel e nossa IA gera fotos ultra-realistas prontas para seus anúncios.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
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
              <Label className="text-sm text-foreground mb-1.5 block">
                Descrição detalhada
              </Label>
              <Textarea
                placeholder="Ex: Foto profissional de uma sala de estar ampla com piso de porcelanato, sofá cinza, mesa de centro em madeira, janelas grandes com luz natural..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-background min-h-[140px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Quanto mais detalhes, melhor o resultado. Inclua estilo, iluminação, cores e materiais.
              </p>
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

            {generatedImage && (
              <Button
                onClick={handleDownload}
                variant="outline"
                className="w-full gap-2"
              >
                <Download className="h-4 w-4" />
                Baixar Foto em Alta Resolução
              </Button>
            )}
          </div>

          {/* Preview */}
          <div className="flex flex-col items-center justify-center">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Resultado
            </p>
            <div className="border border-border rounded-lg overflow-hidden shadow-xl bg-muted/30 flex items-center justify-center w-full min-h-[300px] max-h-[520px]">
              {isLoading ? (
                <div className="flex flex-col items-center gap-3 p-8 text-muted-foreground">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm font-medium">Gerando sua foto ultra-realista...</p>
                  <p className="text-xs">Isso pode levar alguns segundos</p>
                </div>
              ) : generatedImage ? (
                <img
                  src={generatedImage}
                  alt="Foto gerada por IA"
                  className="block w-full h-auto max-h-[500px] object-contain"
                />
              ) : (
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
