import { useState, useRef, useEffect } from "react";
import { Camera, Download, Sparkles, Loader2, ExternalLink, Copy, RefreshCw, Wifi, WifiOff, ShieldCheck, Image as ImageIcon } from "lucide-react";
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
  {
    label: "Quarto de luxo",
    prompt: "Ultra-realistic professional interior photography of a luxurious master bedroom, king bed, soft lighting, 4k",
  }
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
    unsplash: boolean | null;
    pollinations: boolean | null;
  }>({ google: null, unsplash: null, pollinations: null });
  const [isProbing, setIsProbing] = useState(false);

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

  const runDiagnostic = async () => {
    setIsProbing(true);
    setProbeResults({ google: null, unsplash: null, pollinations: null });

    const google = await probeConnectivity("https://www.google.com/favicon.ico");
    setProbeResults(prev => ({ ...prev, google }));

    const unsplash = await probeConnectivity("https://loremflickr.com/favicon.ico");
    setProbeResults(prev => ({ ...prev, unsplash }));

    const pollinations = await probeConnectivity("https://image.pollinations.ai/prompt/test?width=32&height=32");
    setProbeResults(prev => ({ ...prev, pollinations }));

    setIsProbing(false);

    if (google && !pollinations) {
      toast({
        title: "Bloqueio de IA Detectado",
        description: "Sua rede permite sites normais mas bloqueia a IA. Use o 'Modo Banco de Imagem'.",
        variant: "destructive"
      });
      setIsStockMode(true);
    } else if (google && pollinations) {
      toast({ title: "Tudo OK!", description: "Sua rede está livre para gerar fotos com IA." });
    } else {
      toast({ title: "Erro de Rede Geral", description: "Verifique sua conexão com a internet.", variant: "destructive" });
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
      // v2.8 uses provider flag
      const imageUrl = await generateImage(prompt, isStockMode ? "stock" : "ai");

      fallbackRef.current = setTimeout(() => {
        if (loadingRef.current) setShowFallback(true);
      }, 5000);

      watchdogRef.current = setTimeout(() => {
        if (loadingRef.current) {
          stopLoading();
          toast({
            title: "Timeout v2.8",
            description: "Tentando abrir fallback ou link direto.",
            variant: "destructive"
          });
          setGeneratedImage(imageUrl);
        }
      }, 45000);

      setGeneratedImage(imageUrl);
      toast({ title: isStockMode ? "Buscando foto real..." : "Iniciando IA v2.8..." });
    } catch (err: any) {
      stopLoading();
      toast({
        title: "Erro v2.8",
        description: err.message || "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "URL copiada!", description: "Teste colar em uma aba privada." });
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="font-display text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
            <Camera className="h-[18px] w-[18px] text-primary" />
            Estúdio de Fotos Pro
          </h2>
          <div className="flex gap-2">
            <button onClick={forceReload} className="text-[10px] bg-muted hover:bg-muted/80 text-muted-foreground px-2 py-1 rounded flex items-center gap-1 transition-colors">
              <RefreshCw className="h-3 w-3" /> Reiniciar
            </button>
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-1 rounded font-mono">v3.0 stable</span>
          </div>
        </div>

        {/* Diagnostic Panel */}
        <div className="bg-slate-900/5 border border-slate-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Diagnóstico de Saúde da Rede</span>
            </div>
            <Button variant="outline" size="sm" onClick={runDiagnostic} disabled={isProbing} className="h-7 text-[10px] gap-1">
              {isProbing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Rodar Teste
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className={`p-2 rounded border transition-colors ${probeResults.google === true ? 'bg-green-50 border-green-200' : probeResults.google === false ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Google</p>
              <div className="flex justify-center mt-1">
                {probeResults.google === true ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-slate-300" />}
              </div>
            </div>
            <div className={`p-2 rounded border transition-colors ${probeResults.unsplash === true ? 'bg-green-50 border-green-200' : probeResults.unsplash === false ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Banco Imagem</p>
              <div className="flex justify-center mt-1">
                {probeResults.unsplash === true ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-slate-300" />}
              </div>
            </div>
            <div className={`p-2 rounded border transition-colors ${probeResults.pollinations === true ? 'bg-green-50 border-green-200' : probeResults.pollinations === false ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Servidor IA</p>
              <div className="flex justify-center mt-1">
                {probeResults.pollinations === true ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-slate-300" />}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg border border-border">
              <span className="text-xs font-medium">Modo de Geração:</span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={!isStockMode ? "default" : "outline"}
                  onClick={() => setIsStockMode(false)}
                  className="h-7 text-[10px] px-2 gap-1 rounded-md"
                >
                  <Sparkles className="h-3 w-3" /> IA Premium
                </Button>
                <Button
                  size="sm"
                  variant={isStockMode ? "default" : "outline"}
                  onClick={() => setIsStockMode(true)}
                  className="h-7 text-[10px] px-2 gap-1 rounded-md"
                >
                  <ImageIcon className="h-3 w-3" /> Banco de Imagens
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm text-foreground mb-1.5 block">Descrição</Label>
              <Textarea
                placeholder={isStockMode ? "Descreva o que buscar... (Ex: Cozinha moderna)" : "Descreva detalhadamente para a IA..."}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-background min-h-[120px]"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              className={`w-full font-semibold gap-2 rounded-xl transition-all ${isStockMode ? 'bg-slate-800 hover:bg-slate-900 border-none' : 'gradient-primary'}`}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isStockMode ? <ImageIcon className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              {isLoading ? "Processando..." : isStockMode ? "Buscar Foto Realista" : "Gerar com IA Pro"}
            </Button>

            {showFallback && generatedImage && (
              <div className="grid grid-cols-2 gap-2 mt-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                <a
                  href={generatedImage} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 p-2 text-[10px] font-bold text-blue-700 bg-white rounded border border-blue-200 hover:bg-blue-50 transition-colors shadow-sm"
                  onClick={() => stopLoading()}
                >
                  <ExternalLink className="h-3 w-3" /> Abrir direto
                </a>
                <button
                  onClick={() => copyToClipboard(generatedImage)}
                  className="flex items-center justify-center gap-2 p-2 text-[10px] font-bold text-slate-700 bg-white rounded border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Copy className="h-3 w-3" /> Copiar Link
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className="border border-border rounded-lg overflow-hidden shadow-xl bg-muted/30 flex items-center justify-center w-full min-h-[300px] max-h-[520px] relative">
              {isLoading && (
                <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-8 text-slate-600">
                  <div className="relative">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    {isStockMode ? <ImageIcon className="h-6 w-6 absolute top-3 left-3 opacity-50" /> : <Sparkles className="h-6 w-6 absolute top-3 left-3 opacity-50" />}
                  </div>
                  <p className="text-sm font-bold">{isStockMode ? "Buscando fotos reais..." : "Geração v2.8 em curso..."}</p>
                  <p className="text-[10px] text-center opacity-70 max-w-[200px]">Aguardando resposta dos servidores globais.</p>
                </div>
              )}

              {generatedImage ? (
                <img
                  src={generatedImage}
                  alt="Resultado"
                  onLoad={() => stopLoading()}
                  onError={() => {
                    stopLoading();
                    setIsStockMode(true);
                    toast({
                      title: "Rede Bloqueada Detectada",
                      description: "Sua internet bloqueou a IA. Ativamos automaticamente o 'Modo Banco de Imagens' para você conseguir fotos reais.",
                      variant: "destructive"
                    });
                  }}
                  className={`block w-full h-auto max-h-[500px] object-contain transition-all duration-500 ${isLoading ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'}`}
                />
              ) : !isLoading && (
                <div className="flex flex-col items-center gap-2 p-8 text-muted-foreground text-center">
                  <Camera className="h-10 w-10 opacity-20" />
                  <p className="text-sm font-medium">Visualização</p>
                  <p className="text-[10px] opacity-60">Escolha o modo {isStockMode ? 'Banco de Imagens' : 'IA'} para começar.</p>
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
