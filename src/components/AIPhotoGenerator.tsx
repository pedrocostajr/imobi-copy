import { useState, useRef, useEffect } from "react";
import { Camera, Download, Sparkles, Loader2, ExternalLink, Copy, RefreshCw, Wifi, WifiOff } from "lucide-react";
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
    label: "Fachada residencial",
    prompt:
      "Ultra-realistic professional exterior photography of a modern residential house facade, landscaped garden, blue sky, warm golden hour lighting, clean architecture, 4K quality",
  },
];

const AIPhotoGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle");

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

  const testConnection = async () => {
    setConnectionStatus("testing");
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      // Probing Pollinations with a simple request
      const response = await fetch("https://image.pollinations.ai/prompt/test", {
        method: "HEAD",
        mode: "no-cors",
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      setConnectionStatus("ok");
      toast({ title: "Conexão com Servidor de IA OK!", description: "Tudo pronto para gerar sua foto." });
    } catch (err) {
      setConnectionStatus("fail");
      toast({
        title: "Falha de Conexão",
        description: "Seu computador não conseguiu falar com o servidor de fotos. Verifique seu roteador ou VPN.",
        variant: "destructive"
      });
    }
  };

  const forceReload = () => {
    window.location.reload();
  };

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
      }, 3000);

      watchdogRef.current = setTimeout(() => {
        if (loadingRef.current) {
          stopLoading();
          toast({
            title: "Timeout do Servidor (v2.7)",
            description: "A IA está demorando. Use o link direto abaixo.",
            variant: "destructive"
          });
          setGeneratedImage(imageUrl);
        }
      }, 50000);

      setGeneratedImage(imageUrl);
      toast({ title: "Iniciando geração (v2.7)..." });
    } catch (err: any) {
      stopLoading();
      toast({
        title: "Erro v2.7",
        description: err.message || "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "URL copiada!", description: "Envie este link para o suporte se não abrir." });
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="font-display text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
            <Camera className="h-[18px] w-[18px] text-primary" />
            Estúdio de Fotos IA
          </h2>
          <div className="flex gap-2">
            <button onClick={forceReload} className="text-[10px] bg-muted hover:bg-muted/80 text-muted-foreground px-2 py-1 rounded flex items-center gap-1 transition-colors">
              <RefreshCw className="h-3 w-3" /> Atualizar App
            </button>
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-1 rounded font-mono">v2.7 diagnostic</span>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-6 flex items-center gap-3">
          <div className="bg-amber-500/20 p-1.5 rounded-md">
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-500">Diagnóstico v2.7</p>
            <p className="text-xs text-amber-500/80">Se a foto não renderizar, use o Botão de Teste ou Copiar URL abaixo.</p>
          </div>
          <Button variant="outline" size="sm" onClick={testConnection} disabled={connectionStatus === "testing"} className="h-8 text-xs gap-1.5 border-amber-500/30 text-amber-600">
            {connectionStatus === "testing" ? <Loader2 className="h-3 w-3 animate-spin" /> :
              connectionStatus === "ok" ? <Wifi className="h-3 w-3" /> :
                connectionStatus === "fail" ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
            Testar Servidor IA
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-foreground mb-1.5 block">Descrição detalhada</Label>
              <Textarea
                placeholder="Ex: Fachada de casa moderna com jardim e luz do sol..."
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
                  Gerando foto v2.7...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Gerar Foto com IA
                </>
              )}
            </Button>

            {showFallback && generatedImage && (
              <div className="space-y-2">
                <p className="text-center text-[10px] text-amber-600 font-semibold animate-pulse">Servidor demorando? Use o link abaixo:</p>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={generatedImage}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 p-3 text-[10px] font-bold text-amber-600 bg-amber-50 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors shadow-sm"
                    onClick={() => stopLoading()}
                  >
                    <ExternalLink className="h-3 w-3" />
                    Abrir link direto
                  </a>
                  <button
                    onClick={() => copyToClipboard(generatedImage)}
                    className="flex items-center justify-center gap-2 p-3 text-[10px] font-bold text-blue-600 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors shadow-sm"
                  >
                    <Copy className="h-3 w-3" />
                    Copiar URL
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className="border border-border rounded-lg overflow-hidden shadow-xl bg-muted/30 flex items-center justify-center w-full min-h-[300px] max-h-[520px] relative">
              {isLoading && (
                <div className="absolute inset-0 z-10 bg-muted/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-8 text-muted-foreground">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm font-medium">Geração em curso (v2.7)...</p>
                  <p className="text-[10px] text-center opacity-70 italic px-4">Esta versão aguarda o servidor processar sua imagem com máxima qualidade.</p>
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
                      title: "Erro no carregador v2.7",
                      description: "Copie a URL e tente abrir em uma nova aba.",
                      variant: "destructive"
                    });
                  }}
                  className={`block w-full h-auto max-h-[500px] object-contain transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                />
              ) : !isLoading && (
                <div className="flex flex-col items-center gap-2 p-8 text-muted-foreground text-center">
                  <Camera className="h-10 w-10 opacity-30" />
                  <p className="text-sm font-medium">Pronto para gerar</p>
                  <p className="text-[10px] opacity-60">Sua foto aparecerá aqui em alta resolução.</p>
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
