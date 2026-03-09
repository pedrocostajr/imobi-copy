import { useState, useRef, useEffect } from "react";
import { Camera, Download, Sparkles, Loader2, RefreshCw, Wifi, ShieldCheck, Zap, Globe, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { generateImage, probeConnectivity } from "@/lib/ai-service";
import { useToast } from "@/hooks/use-toast";

const AIPhotoGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
    setIsProbing(false);

    if (google) {
      toast({ title: "Rede v7.3 OK", description: "Sua rede está pronta para o túnel Vercel." });
    } else {
      toast({ title: "Erro de Internet", description: "Verifique seu Wi-Fi/Cabo.", variant: "destructive" });
    }
  };

  const forceReload = () => window.location.reload();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Descreva o imóvel ou ambiente", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    loadingRef.current = true;
    setGeneratedImage(null);

    try {
      // v6.0 OPENROUTER ENGINE
      const imageUrl = await generateImage(prompt);

      if (loadingRef.current) {
        setGeneratedImage(imageUrl);
        toast({ title: "Geração v7.3 Concluída!", description: "Imagem processada via Vercel Elite Engine." });
      }
    } catch (err: any) {
      toast({ title: "Erro de Motor v7.3", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement("a");
    link.download = `foto-premium-${Date.now()}.png`;
    link.href = generatedImage;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6 shadow-2xl border-indigo-200/50">
        <div className="flex justify-between items-start mb-4">
          <h2 className="font-display text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
            <Zap className="h-[18px] w-[18px] text-amber-500 fill-amber-500" />
            Estúdio IA v7.3 (Vercel Bridge)
          </h2>
          <div className="flex gap-2">
            <button onClick={forceReload} className="text-[10px] bg-muted hover:bg-muted/80 text-muted-foreground px-2 py-1 rounded flex items-center gap-1 transition-colors">
              <RefreshCw className="h-3 w-3" /> Reiniciar
            </button>
            <span className="text-[10px] bg-black text-white px-2 py-1 rounded-full font-bold shadow-md animate-pulse">v7.3 VERCEL STABLE</span>
          </div>
        </div>

        <div className="mb-4 bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-2 text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-[11px] font-medium">
            <strong>AVISO:</strong> A geração de fotos com IA está passando por uma atualização crítica. Podem ocorrer instabilidades temporárias no carregamento.
          </p>
        </div>

        <div className="bg-emerald-600/5 border border-emerald-600/20 rounded-lg p-3 mb-6 flex items-center gap-3">
          <div className="bg-emerald-600/20 p-1.5 rounded-md">
            <Globe className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-emerald-800 uppercase tracking-tight">Motor OpenRouter Ativado</p>
            <p className="text-xs text-emerald-600/80">Imagens de elite (DALL-E 3) com bypass total de restrições via Túnel Seguro.</p>
          </div>
          <Button variant="outline" size="sm" onClick={runDiagnostic} disabled={isProbing} className="h-8 text-xs gap-1.5 border-emerald-200 text-emerald-600 hover:bg-emerald-50">
            {isProbing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wifi className="h-3 w-3" />}
            Checar Elite v6
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-foreground mb-1.5 block font-bold text-indigo-900">Descreva o Ambiente Pro</Label>
              <Textarea
                placeholder="Ex: Fachada ultra luxuosa de mansão moderna com piscina infinita ao pôr do sol..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-white min-h-[160px] border-indigo-200 focus:border-indigo-500 focus:ring-indigo-100 transition-all rounded-2xl text-sm"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              className="w-full font-black h-16 gap-3 rounded-2xl transition-all bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100 hover:scale-[1.01] active:scale-[0.98]"
            >
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6" />}
              {isLoading ? "CONECTANDO OPENROUTER..." : "GERAR IMAGEM ELITE IA"}
            </Button>

            {generatedImage && !isLoading && (
              <Button onClick={handleDownload} variant="outline" className="w-full h-12 gap-2 border-indigo-200 text-indigo-800 hover:bg-indigo-50 transition-all font-bold">
                <Download className="h-4 w-4" /> Baixar Versão em Alta Definição
              </Button>
            )}

            <p className="text-[10px] text-center text-muted-foreground italic">
              A v7.3 Vercel Stable utiliza infraestrutura de borda para furar bloqueios corporativos.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className="border-2 border-indigo-100/50 rounded-3xl overflow-hidden bg-white flex items-center justify-center w-full min-h-[450px] relative shadow-inner">
              {isLoading && (
                <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center gap-6 p-10">
                  <div className="relative">
                    <Loader2 className="h-20 w-20 animate-spin text-indigo-600/80" />
                    <Zap className="h-8 w-8 absolute top-6 left-6 text-amber-500 animate-bounce" />
                  </div>
                  <div className="text-center space-y-3">
                    <p className="text-xl font-black text-black tracking-tighter uppercase">Processando Vercel v7.3</p>
                    <p className="text-xs text-muted-foreground font-semibold max-w-[280px]">Estamos reconstruindo a imagem via Vercel. Se demorar muito, reinicie a página.</p>
                  </div>
                </div>
              )}

              {generatedImage ? (
                <img
                  src={generatedImage}
                  alt="Resultado Premium v7.3"
                  className={`block w-full h-auto max-h-[600px] object-contain transition-all duration-1000 ease-out ${isLoading ? 'opacity-0 scale-90 blur-3xl' : 'opacity-100 scale-100 blur-0'}`}
                />
              ) : !isLoading && (
                <div className="flex flex-col items-center gap-5 p-12 text-indigo-100 text-center">
                  <div className="bg-indigo-50/50 p-8 rounded-full shadow-inner border border-indigo-100/50">
                    <Camera className="h-16 w-16 text-indigo-200" />
                  </div>
                  <p className="text-sm font-black text-indigo-200 uppercase tracking-[0.2em]">Ponte OpenRouter v6</p>
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
