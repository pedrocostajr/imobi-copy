import { useState, useRef, useEffect } from "react";
import { Camera, Download, Sparkles, Loader2, ExternalLink, Copy, RefreshCw, Wifi, WifiOff, ShieldCheck, Image as ImageIcon, Send } from "lucide-react";
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
import { generateImage, probeConnectivity } from "@/lib/ai-service";
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
  const [isStockMode, setIsStockMode] = useState(false);

  const [probeResults, setProbeResults] = useState<{
    google: boolean | null;
    pollinations: boolean | null;
  }>({ google: null, pollinations: null });
  const [isProbing, setIsProbing] = useState(false);

  const loadingRef = useRef(false);
  const watchdogRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
    };
  }, []);

  const runDiagnostic = async () => {
    setIsProbing(true);
    const google = await probeConnectivity("https://www.google.com/favicon.ico");
    const pollinations = await probeConnectivity("https://image.pollinations.ai/prompt/test?width=32");
    setProbeResults({ google, pollinations });
    setIsProbing(false);

    if (google && !pollinations) {
      toast({ title: "Filtro Ativo", description: "Sua rede bloqueia a IA. O v4.0 Proxy vai tentar furar o bloqueio.", variant: "destructive" });
    }
  };

  const forceReload = () => window.location.reload();

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
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Descreva o imóvel", variant: "destructive" });
      return;
    }

    stopLoading();
    setIsLoading(true);
    loadingRef.current = true;
    setGeneratedImage(null);

    try {
      // v4.0 PROXY
      const imageUrl = await generateImage(prompt, isStockMode ? "stock" : "ai");

      watchdogRef.current = setTimeout(() => {
        if (loadingRef.current) {
          stopLoading();
          toast({ title: "Atraso no Servidor", description: "A imagem está sendo processada.", variant: "destructive" });
          setGeneratedImage(imageUrl);
        }
      }, 55000);

      setGeneratedImage(imageUrl);
    } catch (err: any) {
      stopLoading();
      toast({ title: "Erro v4.0", description: err.message, variant: "destructive" });
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement("a");
    link.download = `foto-copylmob-${Date.now()}.png`;
    link.href = generatedImage;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="font-display text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
            <Camera className="h-[18px] w-[18px] text-primary" />
            Estúdio IA v4.0 (Proxy Mode)
          </h2>
          <div className="flex gap-2">
            <button onClick={forceReload} className="text-[10px] bg-muted hover:bg-muted/80 text-muted-foreground px-2 py-1 rounded flex items-center gap-1 transition-colors">
              <RefreshCw className="h-3 w-3" /> Reiniciar
            </button>
            <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-1 rounded font-mono shadow-sm">v4.0 PROXY SERVER</span>
          </div>
        </div>

        <div className="bg-indigo-600/5 border border-indigo-600/20 rounded-lg p-3 mb-6 flex items-center gap-3">
          <div className="bg-indigo-600/20 p-1.5 rounded-md">
            <Send className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-indigo-700">Modo de Resgate Ativado</p>
            <p className="text-xs text-indigo-600/80">Esta versão usa um túnel seguro para buscar a imagem e entregá-la direto no seu dashboard.</p>
          </div>
          <Button variant="outline" size="sm" onClick={runDiagnostic} disabled={isProbing} className="h-8 text-xs gap-1.5 border-indigo-200 text-indigo-600">
            {isProbing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wifi className="h-3 w-3" />}
            Testar Rede v4
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg border border-border">
              <span className="text-xs font-medium">Método:</span>
              <div className="flex gap-1">
                <Button size="sm" variant={!isStockMode ? "default" : "outline"} onClick={() => setIsStockMode(false)} className="h-7 text-[10px] px-2 gap-1 rounded-md">
                  <Sparkles className="h-3 w-3" /> IA Proxy (Fura Bloqueio)
                </Button>
                <Button size="sm" variant={isStockMode ? "default" : "outline"} onClick={() => setIsStockMode(true)} className="h-7 text-[10px] px-2 gap-1 rounded-md">
                  <ImageIcon className="h-3 w-3" /> Banco Imagem (Safe)
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm text-foreground mb-1.5 block">Descrição do Imóvel</Label>
              <Textarea
                placeholder="Ex: Cozinha moderna com ilha central e luz quente..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-background min-h-[120px] border-indigo-100 focus:border-indigo-300"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              className="w-full font-bold h-12 gap-2 rounded-xl transition-all gradient-primary shadow-lg shadow-indigo-200"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {isLoading ? "FURANDO BLOQUEIO DE REDE..." : "GERAR FOTO COM IA"}
            </Button>

            {generatedImage && !isLoading && (
              <Button onClick={handleDownload} variant="outline" className="w-full gap-2 border-indigo-200 text-indigo-700">
                <Download className="h-4 w-4" /> Baixar Imagem Gerada
              </Button>
            )}
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className="border-2 border-dashed border-indigo-100 rounded-2xl overflow-hidden bg-indigo-50/30 flex items-center justify-center w-full min-h-[350px] relative">
              {isLoading && (
                <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-8">
                  <div className="relative">
                    <Loader2 className="h-14 w-14 animate-spin text-indigo-600" />
                    <ShieldCheck className="h-6 w-6 absolute top-4 left-4 text-indigo-400 opacity-50" />
                  </div>
                  <p className="text-sm font-bold text-indigo-900 uppercase tracking-wider">Processando via Túnel v4...</p>
                  <p className="text-[10px] text-center text-indigo-600 opacity-70 max-w-[220px]">Estamos baixando a imagem no servidor para que sua rede não a bloqueie.</p>
                </div>
              )}

              {generatedImage ? (
                <img
                  src={generatedImage}
                  alt="Resultado v4.0"
                  onLoad={() => stopLoading()}
                  onError={() => {
                    stopLoading();
                    toast({ title: "Erro Crítico v4", description: "O servidor proxy falhou. Tente o modo Safe.", variant: "destructive" });
                  }}
                  className={`block w-full h-auto max-h-[500px] object-contain transition-all duration-700 ${isLoading ? 'opacity-0 scale-95 blur-xl' : 'opacity-100 scale-100 blur-0'}`}
                />
              ) : !isLoading && (
                <div className="flex flex-col items-center gap-3 p-8 text-indigo-300 text-center">
                  <div className="bg-indigo-50 p-4 rounded-full">
                    <Camera className="h-12 w-12" />
                  </div>
                  <p className="text-sm font-semibold text-indigo-400 uppercase tracking-tight">O resultado tunelado aparecerá aqui</p>
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
