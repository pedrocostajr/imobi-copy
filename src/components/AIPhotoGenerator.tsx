import { useState, useRef, useEffect } from "react";
import { Camera, Download, Sparkles, Loader2, RefreshCw, Wifi, ShieldCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      toast({ title: "Filtro Detectado", description: "Sua rede bloqueia a IA. O v5.0 Pure Bridge vai gerar a foto no servidor para você.", variant: "destructive" });
    } else {
      toast({ title: "Teste Concluído", description: "Seu sistema está pronto para gerar." });
    }
  };

  const forceReload = () => window.location.reload();

  const stopLoading = () => {
    setIsLoading(false);
    loadingRef.current = false;
    if (watchdogRef.current) clearTimeout(watchdogRef.current);
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
      // v5.0 PURE BRIDGE - No more stock provider
      const imageUrl = await generateImage(prompt);

      watchdogRef.current = setTimeout(() => {
        if (loadingRef.current) {
          stopLoading();
          toast({ title: "Quase pronto...", description: "A imagem está sendo processada no servidor.", variant: "default" });
          setGeneratedImage(imageUrl);
        }
      }, 55000);

      setGeneratedImage(imageUrl);
      toast({ title: "Geração Iniciada", description: "Processando via Ponte Segura v5.0." });
    } catch (err: any) {
      stopLoading();
      toast({ title: "Erro v5.0", description: err.message, variant: "destructive" });
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
      <div className="glass-card rounded-xl p-6 shadow-2xl border-indigo-100/50">
        <div className="flex justify-between items-start mb-4">
          <h2 className="font-display text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
            <Camera className="h-[18px] w-[18px] text-indigo-600" />
            Estúdio IA v5.1 (Direct Bridge)
          </h2>
          <div className="flex gap-2">
            <button onClick={forceReload} className="text-[10px] bg-muted hover:bg-muted/80 text-muted-foreground px-2 py-1 rounded flex items-center gap-1 transition-colors">
              <RefreshCw className="h-3 w-3" /> Reiniciar
            </button>
            <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-1 rounded font-mono shadow-md animate-pulse">v5.1 DIRECT FETCH</span>
          </div>
        </div>

        <div className="bg-indigo-600/5 border border-indigo-600/20 rounded-lg p-3 mb-6 flex items-center gap-3">
          <div className="bg-indigo-600/20 p-1.5 rounded-md">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-emerald-700 uppercase tracking-tighter">Bypass de Rede v5.1 Ativo</p>
            <p className="text-xs text-emerald-600/80 italic">Usando conexão direta via porta 443 para furar bloqueios de firewall.</p>
          </div>
          <Button variant="outline" size="sm" onClick={runDiagnostic} disabled={isProbing} className="h-8 text-xs gap-1.5 border-emerald-200 text-emerald-600 hover:bg-emerald-50">
            {isProbing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wifi className="h-3 w-3" />}
            Testar Rede v5.1
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-foreground mb-1.5 block font-semibold text-indigo-900">O que você quer visualizar?</Label>
              <Textarea
                placeholder="Ex: Sala de estar minimalista com muita luz natural e cores pastéis..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-white min-h-[140px] border-indigo-100 focus:border-indigo-400 focus:ring-indigo-100 transition-all rounded-xl"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              className="w-full font-black h-14 gap-3 rounded-xl transition-all gradient-primary shadow-xl shadow-indigo-100 hover:scale-[1.01] active:scale-[0.98]"
            >
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6" />}
              {isLoading ? "PROCESSANDO VIA PONTE v5..." : "GERAR FOTO PROFISSIONAL"}
            </Button>

            {generatedImage && !isLoading && (
              <Button onClick={handleDownload} variant="outline" className="w-full h-12 gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-all font-bold">
                <Download className="h-4 w-4" /> Baixar Imagem em Alta Resolução
              </Button>
            )}

            <p className="text-[10px] text-center text-muted-foreground opacity-60">
              Versão 5.0 focada em máxima qualidade e bypass de filtros corporativos.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className="border-2 border-indigo-100/50 rounded-2xl overflow-hidden bg-indigo-50/20 flex items-center justify-center w-full min-h-[400px] relative shadow-inner">
              {isLoading && (
                <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center gap-5 p-10">
                  <div className="relative">
                    <Loader2 className="h-16 w-16 animate-spin text-indigo-600" />
                    <ShieldCheck className="h-7 w-7 absolute top-4.5 left-4.5 text-indigo-400/50" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-lg font-black text-indigo-950 tracking-tight leading-none uppercase">Gerando via Bridge</p>
                    <p className="text-[11px] text-indigo-600 font-medium max-w-[240px]">Estamos reconstruindo os pixels no servidor para entregar direto na sua tela.</p>
                  </div>
                </div>
              )}

              {generatedImage ? (
                <img
                  src={generatedImage}
                  alt="IA Result v5.0"
                  onLoad={() => stopLoading()}
                  onError={() => {
                    stopLoading();
                    toast({ title: "Erro na Bridge", description: "O servidor não conseguiu reconstruir a imagem.", variant: "destructive" });
                  }}
                  className={`block w-full h-auto max-h-[550px] object-contain transition-all duration-1000 ease-out ${isLoading ? 'opacity-0 scale-90 blur-2xl' : 'opacity-100 scale-100 blur-0'}`}
                />
              ) : !isLoading && (
                <div className="flex flex-col items-center gap-4 p-12 text-indigo-200 text-center">
                  <div className="bg-white p-6 rounded-full shadow-sm border border-indigo-50">
                    <Camera className="h-14 w-14 text-indigo-100" />
                  </div>
                  <p className="text-sm font-bold text-indigo-300 uppercase tracking-widest">Aguardando seu comando</p>
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
