import { useState } from "react";
import { Building2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import CopyForm from "@/components/CopyForm";
import CopyResults from "@/components/CopyResults";
import CreativeGenerator from "@/components/CreativeGenerator";
import AIPhotoGenerator from "@/components/AIPhotoGenerator";
import ManualCopyForm from "@/components/ManualCopyForm";
import { CopyFormData, CopyResult } from "@/lib/copy-types";
import { generateCopy } from "@/lib/ai-service";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [result, setResult] = useState<CopyResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copyMode, setCopyMode] = useState<"ai" | "manual">("ai");
  const [lastFormData, setLastFormData] = useState<CopyFormData | null>(null);
  const { toast } = useToast();

  const activeEngine = "Gemini AI Engine (Ultra)";

  const handleGenerate = async (data: CopyFormData) => {
    setIsLoading(true);
    setResult(null);
    setLastFormData(data);

    try {
      const parsed = await generateCopy(data);
      setResult(parsed);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Erro ao gerar copy",
        description: err.message || "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (lastFormData) {
      handleGenerate(lastFormData);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Maintenance Notice */}
      <div className="bg-amber-950 py-2.5 px-4 text-center border-b border-amber-500/20">
        <p className="text-sm font-semibold text-amber-200 animate-pulse flex items-center justify-center gap-2">
          <span>🚀</span> O sistema está passando por uma atualização importante. Algumas funções podem oscilar temporariamente.
        </p>
      </div>

      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container max-w-5xl mx-auto flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-2">
            <div className="gradient-primary p-2 rounded-lg">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">
              CopyImob Engine™
            </span>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block">
            Motor inteligente de anúncios imobiliários
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="container max-w-5xl mx-auto px-4 pt-12 pb-8 text-center">
        <div className="inline-flex items-center gap-1.5 bg-accent/10 text-accent border border-accent/20 rounded-full px-3 py-1 text-xs font-medium mb-6">
          <Sparkles className="h-3 w-3" />
          Gerado por {activeEngine}
        </div>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-3">
          Gere anúncios imobiliários
          <br />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            em segundos.
          </span>
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
          Pare de travar na hora de anunciar imóveis. Preencha os dados, clique e receba copies prontas para Meta Ads e WhatsApp.
        </p>
      </section>

      {/* Main Content */}
      <main className="container max-w-5xl mx-auto px-4 pb-16">
        <Tabs defaultValue="copy" className="w-full">
          <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="copy">📝 Gerar Copy</TabsTrigger>
            <TabsTrigger value="creative">🎨 Criar Imagem</TabsTrigger>
            <TabsTrigger value="photo">📷 Foto IA</TabsTrigger>
          </TabsList>

          <TabsContent value="copy">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-center gap-4 mb-2">
                <Button
                  variant={copyMode === "ai" ? "default" : "outline"}
                  onClick={() => setCopyMode("ai")}
                  className={`flex-1 max-w-[200px] gap-2 rounded-xl h-11 ${copyMode === "ai" ? "gradient-primary border-none shadow-md" : ""}`}
                >
                  <Sparkles className={`h-4 w-4 ${copyMode === "ai" ? "text-primary-foreground" : "text-primary"}`} />
                  Gerar com IA
                </Button>
                <Button
                  variant={copyMode === "manual" ? "default" : "outline"}
                  onClick={() => setCopyMode("manual")}
                  className={`flex-1 max-w-[200px] gap-2 rounded-xl h-11 ${copyMode === "manual" ? "bg-accent text-accent-foreground border-none shadow-md" : ""}`}
                >
                  <div className="h-4 w-4 flex items-center justify-center font-bold text-[10px] border-2 border-current rounded-sm">M</div>
                  Sem IA (Manual)
                </Button>
              </div>

              {copyMode === "ai" ? (
                <CopyForm onSubmit={handleGenerate} isLoading={isLoading} />
              ) : (
                <ManualCopyForm onSave={(data) => setResult(data)} initialData={result} />
              )}
            </div>

            {result && (
              <div className="mt-10 animate-fade-up">
                <CopyResults result={result} onRegenerate={handleRegenerate} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="creative">
            <CreativeGenerator />
          </TabsContent>

          <TabsContent value="photo">
            <AIPhotoGenerator />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 text-center text-xs text-muted-foreground">
        CopyImob Engine™ — Anúncios que vendem.
      </footer>
    </div>
  );
};

export default Index;
