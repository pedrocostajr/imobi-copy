import { useState } from "react";
import { Building2, Sparkles } from "lucide-react";
import CopyForm from "@/components/CopyForm";
import CopyResults from "@/components/CopyResults";
import CreativeGenerator from "@/components/CreativeGenerator";
import AIPhotoGenerator from "@/components/AIPhotoGenerator";
import { CopyFormData, CopyResult } from "@/lib/copy-types";
import { generateCopy } from "@/lib/ai-service";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [result, setResult] = useState<CopyResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const activeEngine = import.meta.env.VITE_OPENAI_API_KEY ? "GPT-4o (OpenAI)" : "Gemini 1.5 (Google)";

  const handleGenerate = async (data: CopyFormData) => {
    setIsLoading(true);
    setResult(null);

    try {
      const parsed = await generateCopy(data);
      setResult(parsed);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Erro ao gerar copy",
        description: err.message || "Tente novamente em alguns instantes. Verifique sua chave API no arquivo .env",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
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
            <CopyForm onSubmit={handleGenerate} isLoading={isLoading} />
            {result && (
              <div className="mt-10 animate-fade-up">
                <CopyResults result={result} onRegenerate={() => { }} />
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
