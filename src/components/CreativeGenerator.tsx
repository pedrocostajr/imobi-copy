import { useState, useRef, useCallback, useEffect } from "react";
import { Download, Upload, Image as ImageIcon, Sparkles, Palette, Loader2 } from "lucide-react";
import { generateImage } from "@/lib/ai-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type TemplateId = "bold" | "minimal" | "gradient" | "dark" | "luxury" | "neon";

interface TemplateConfig {
  id: TemplateId;
  name: string;
  description: string;
}

const TEMPLATES: TemplateConfig[] = [
  { id: "bold", name: "Bold", description: "Headline impactante com barra inferior" },
  { id: "minimal", name: "Minimal", description: "Elegante e limpo sobre a imagem" },
  { id: "gradient", name: "Gradiente", description: "Painel lateral com gradiente" },
  { id: "dark", name: "Escuro", description: "Overlay escuro com destaque dourado" },
  { id: "luxury", name: "Luxo", description: "Moldura dourada premium" },
  { id: "neon", name: "Neon", description: "Estilo moderno com brilho neon" },
];

const FORMATS = [
  { label: "Feed (1080×1080)", width: 1080, height: 1080 },
  { label: "Story (1080×1920)", width: 1080, height: 1920 },
  { label: "Paisagem (1200×628)", width: 1200, height: 628 },
];

const COLOR_PRESETS = [
  { name: "Dourado", primary: "#e8a020", accent: "#0a1940" },
  { name: "Azul Royal", primary: "#1e40af", accent: "#ffffff" },
  { name: "Verde Esmeralda", primary: "#059669", accent: "#ffffff" },
  { name: "Vermelho", primary: "#dc2626", accent: "#ffffff" },
  { name: "Roxo", primary: "#7c3aed", accent: "#ffffff" },
  { name: "Rosa", primary: "#ec4899", accent: "#ffffff" },
];

interface CreativeData {
  headline: string;
  subtext: string;
  cta: string;
  location: string;
  price: string;
  brand: string;
}

interface ColorConfig {
  primary: string;
  accent: string;
}

const CreativeGenerator = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [template, setTemplate] = useState<TemplateId>("bold");
  const [formatIdx, setFormatIdx] = useState(0);
  const [colors, setColors] = useState<ColorConfig>({ primary: "#e8a020", accent: "#0a1940" });
  const [data, setData] = useState<CreativeData>({
    headline: "",
    subtext: "",
    cta: "Saiba mais",
    location: "",
    price: "",
    brand: "",
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const generatingRef = useRef(false);
  const watchdogRef = useRef<NodeJS.Timeout | null>(null);

  const format = FORMATS[formatIdx];

  const update = (key: keyof CreativeData, value: string) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const handleAiGenerate = async () => {
    if (!data.headline && !data.subtext) {
      toast({ title: "Preencha a Headline ou Subtexto para guiar a IA", variant: "destructive" });
      return;
    }

    if (watchdogRef.current) clearTimeout(watchdogRef.current);
    setIsGenerating(true);
    generatingRef.current = true;

    try {
      const prompt = `${data.headline} ${data.subtext}`.trim() || "modern luxury real estate interior";
      const imageUrl = await generateImage(prompt);

      // Watchdog de 60 segundos (v2.5)
      watchdogRef.current = setTimeout(() => {
        if (generatingRef.current) {
          setIsGenerating(false);
          generatingRef.current = false;
          toast({
            title: "O servidor demorou muito (v2.5)",
            description: "A imagem pode não carregar automaticamente.",
            variant: "destructive"
          });
        }
      }, 60000);

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setImage(img);
        setIsGenerating(false);
        generatingRef.current = false;
        if (watchdogRef.current) clearTimeout(watchdogRef.current);
        toast({ title: "Imagem gerada com IA! (v2.5)" });
      };
      img.onerror = () => {
        setIsGenerating(false);
        generatingRef.current = false;
        if (watchdogRef.current) clearTimeout(watchdogRef.current);
        toast({ title: "Erro ao processar imagem da IA (v2.5)", variant: "destructive" });
      };
      img.src = imageUrl;
    } catch (err: any) {
      console.error("🚨 Erro Criativo v2.5:", err);
      setIsGenerating(false);
      generatingRef.current = false;
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
      toast({
        title: "Erro na geração (v2.5)",
        description: err.message || "Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => setImage(img);
    img.src = url;
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => setLogoImage(img);
    img.src = url;
  };

  const renderCanvas = useCallback(
    (img: HTMLImageElement | null, tpl: TemplateId, d: CreativeData, fmt: typeof FORMATS[0], cols: ColorConfig, logo: HTMLImageElement | null, scale = 0.5) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = fmt.width * scale;
      canvas.height = fmt.height * scale;
      const w = canvas.width;
      const h = canvas.height;

      ctx.save();

      // Draw image or placeholder
      if (img) {
        drawCoverImage(ctx, img, w, h);
      } else {
        ctx.fillStyle = "#111827";
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.lineWidth = 1;
        for (let i = 0; i < w; i += w * 0.05) {
          ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
        }
        for (let i = 0; i < h; i += w * 0.05) {
          ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
        }
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.font = `600 ${w * 0.035}px 'Space Grotesk', sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("📷 Faça upload de uma foto", w / 2, h / 2);
      }

      // Apply template
      const renderers: Record<TemplateId, () => void> = {
        bold: () => drawBoldTemplate(ctx, w, h, d, cols),
        minimal: () => drawMinimalTemplate(ctx, w, h, d, cols),
        gradient: () => drawGradientTemplate(ctx, w, h, d, cols),
        dark: () => drawDarkTemplate(ctx, w, h, d, cols),
        luxury: () => drawLuxuryTemplate(ctx, w, h, d, cols),
        neon: () => drawNeonTemplate(ctx, w, h, d, cols),
      };
      renderers[tpl]();

      // Draw logo
      if (logo) {
        drawLogo(ctx, logo, w, h);
      }

      ctx.restore();
    },
    []
  );

  useEffect(() => {
    renderCanvas(image, template, data, format, colors, logoImage);
  }, [image, template, data, format, colors, logoImage, renderCanvas]);

  const handleDownload = () => {
    if (!image) {
      toast({ title: "Faça upload de uma foto primeiro", variant: "destructive" });
      return;
    }
    const offscreen = document.createElement("canvas");
    offscreen.width = format.width;
    offscreen.height = format.height;
    const ctx = offscreen.getContext("2d")!;
    const w = offscreen.width;
    const h = offscreen.height;

    drawCoverImage(ctx, image, w, h);

    const renderers: Record<TemplateId, () => void> = {
      bold: () => drawBoldTemplate(ctx, w, h, data, colors),
      minimal: () => drawMinimalTemplate(ctx, w, h, data, colors),
      gradient: () => drawGradientTemplate(ctx, w, h, data, colors),
      dark: () => drawDarkTemplate(ctx, w, h, data, colors),
      luxury: () => drawLuxuryTemplate(ctx, w, h, data, colors),
      neon: () => drawNeonTemplate(ctx, w, h, data, colors),
    };
    renderers[template]();

    if (logoImage) {
      drawLogo(ctx, logoImage, w, h);
    }

    const link = document.createElement("a");
    link.download = `criativo-${template}-${format.width}x${format.height}.png`;
    link.href = offscreen.toDataURL("image/png");
    link.click();
    toast({ title: "Criativo baixado!", description: `${format.width}×${format.height}px` });
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <ImageIcon className="h-[18px] w-[18px] text-primary" />
          Gerador de Criativo
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm text-foreground mb-1.5 block">IA ou Própria</Label>
                <div className="flex gap-2">
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileUpload} className="hidden" />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1 gap-2">
                    <Upload className="h-4 w-4" />
                    Upload
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAiGenerate}
                    disabled={isGenerating}
                    className="flex-1 gap-2 border-primary/30 hover:border-primary/60 hover:bg-primary/5"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-primary" />
                    )}
                    IA
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm text-foreground mb-1.5 block">Logomarca</Label>
                <input type="file" ref={logoInputRef} accept="image/*" onChange={handleLogoUpload} className="hidden" />
                <Button type="button" variant="outline" onClick={() => logoInputRef.current?.click()} className="w-full gap-2">
                  <Upload className="h-4 w-4" />
                  {logoImage ? "Trocar logo" : "Upload logo"}
                </Button>
              </div>
            </div>

            {logoImage && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border">
                <img src={logoImage.src} alt="Logo preview" className="h-8 w-8 object-contain rounded" />
                <span className="text-xs text-muted-foreground flex-1">Logo carregada</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setLogoImage(null)} className="h-6 px-2 text-xs">
                  Remover
                </Button>
              </div>
            )}

            <div>
              <Label className="text-sm text-foreground mb-1.5 block">Template</Label>
              <Select value={template} onValueChange={(v) => setTemplate(v as TemplateId)}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <span className="font-medium">{t.name}</span>
                      <span className="text-muted-foreground ml-2 text-xs">— {t.description}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm text-foreground mb-1.5 block">Formato</Label>
              <Select value={String(formatIdx)} onValueChange={(v) => setFormatIdx(Number(v))}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FORMATS.map((f, i) => (
                    <SelectItem key={i} value={String(i)}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Color Customization */}
            <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-3">
              <Label className="text-sm text-foreground font-medium flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-primary" />
                Personalização de Cores
              </Label>

              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setColors({ primary: preset.primary, accent: preset.accent })}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all ${colors.primary === preset.primary
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                  >
                    <span className="w-3 h-3 rounded-full border border-border/50" style={{ backgroundColor: preset.primary }} />
                    {preset.name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Cor primária</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colors.primary}
                      onChange={(e) => setColors((c) => ({ ...c, primary: e.target.value }))}
                      className="w-8 h-8 rounded cursor-pointer border border-border"
                    />
                    <Input
                      value={colors.primary}
                      onChange={(e) => setColors((c) => ({ ...c, primary: e.target.value }))}
                      className="bg-background text-xs h-8 font-mono"
                      placeholder="#e8a020"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Cor de contraste</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colors.accent}
                      onChange={(e) => setColors((c) => ({ ...c, accent: e.target.value }))}
                      className="w-8 h-8 rounded cursor-pointer border border-border"
                    />
                    <Input
                      value={colors.accent}
                      onChange={(e) => setColors((c) => ({ ...c, accent: e.target.value }))}
                      className="bg-background text-xs h-8 font-mono"
                      placeholder="#0a1940"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm text-foreground mb-1.5 block">Marca / Logo (texto)</Label>
              <Input placeholder="Ex: Imobiliária Premium" value={data.brand} onChange={(e) => update("brand", e.target.value)} className="bg-background" />
            </div>
            <div>
              <Label className="text-sm text-foreground mb-1.5 block">Headline</Label>
              <Input placeholder="Ex: Seu novo lar na Vila Olímpia" value={data.headline} onChange={(e) => update("headline", e.target.value)} className="bg-background" />
            </div>
            <div>
              <Label className="text-sm text-foreground mb-1.5 block">Subtexto</Label>
              <Input placeholder="Ex: Apartamentos de 2 e 3 dormitórios" value={data.subtext} onChange={(e) => update("subtext", e.target.value)} className="bg-background" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm text-foreground mb-1.5 block">Localização</Label>
                <Input placeholder="Ex: Vila Olímpia, SP" value={data.location} onChange={(e) => update("location", e.target.value)} className="bg-background" />
              </div>
              <div>
                <Label className="text-sm text-foreground mb-1.5 block">Preço</Label>
                <Input placeholder="Ex: A partir de R$ 450k" value={data.price} onChange={(e) => update("price", e.target.value)} className="bg-background" />
              </div>
            </div>
            <div>
              <Label className="text-sm text-foreground mb-1.5 block">CTA</Label>
              <Input placeholder="Ex: Agende sua visita" value={data.cta} onChange={(e) => update("cta", e.target.value)} className="bg-background" />
            </div>

            <Button onClick={handleDownload} className="w-full gradient-primary text-primary-foreground font-semibold gap-2 rounded-xl">
              <Download className="h-4 w-4" />
              Baixar Criativo em Alta Resolução
            </Button>
          </div>

          {/* Preview */}
          <div className="flex flex-col items-center justify-center">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Pré-visualização</p>
            <div className="border border-border rounded-lg overflow-hidden shadow-xl bg-muted/30 flex items-center justify-center" style={{ maxWidth: "100%", maxHeight: 520 }}>
              <canvas
                ref={canvasRef}
                className="block"
                style={{ maxWidth: "100%", maxHeight: 500, aspectRatio: `${format.width}/${format.height}` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== Shared Helpers ====================

function drawCoverImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const imgRatio = img.width / img.height;
  const canvasRatio = w / h;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (imgRatio > canvasRatio) { sw = img.height * canvasRatio; sx = (img.width - sw) / 2; }
  else { sh = img.width / canvasRatio; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
}

function drawLogo(ctx: CanvasRenderingContext2D, logo: HTMLImageElement, w: number, h: number) {
  const maxLogoH = h * 0.07;
  const maxLogoW = w * 0.18;
  const logoRatio = logo.width / logo.height;
  let lw = maxLogoH * logoRatio;
  let lh = maxLogoH;
  if (lw > maxLogoW) {
    lw = maxLogoW;
    lh = maxLogoW / logoRatio;
  }
  const pad = w * 0.04;
  const lx = w - pad - lw;
  const ly = pad;
  // Subtle background for visibility
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  roundRect(ctx, lx - 6, ly - 6, lw + 12, lh + 12, 6);
  ctx.fill();
  ctx.drawImage(logo, lx, ly, lw, lh);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  for (const word of words) {
    const testLine = line + word + " ";
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, currentY);
      line = word + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
  return currentY;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawPill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fontSize: number, bgColor: string, textColor: string, align: "left" | "center" = "left") {
  ctx.font = `700 ${fontSize}px 'Space Grotesk', sans-serif`;
  const tw = ctx.measureText(text).width;
  const px = fontSize * 0.6;
  const py = fontSize * 0.35;
  const pillW = tw + px * 2;
  const pillH = fontSize + py * 2;
  const rx = align === "center" ? x - pillW / 2 : x;
  ctx.fillStyle = bgColor;
  roundRect(ctx, rx, y - fontSize - py, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = textColor;
  ctx.textAlign = align;
  const textX = align === "center" ? x : rx + px;
  ctx.fillText(text, textX, y - py);
  ctx.textAlign = "left";
}

function drawBrandWatermark(ctx: CanvasRenderingContext2D, w: number, h: number, brand: string, color = "rgba(255,255,255,0.5)") {
  if (!brand) return;
  ctx.fillStyle = color;
  ctx.font = `600 ${w * 0.022}px 'Space Grotesk', sans-serif`;
  ctx.textAlign = "right";
  ctx.fillText(brand, w - w * 0.04, h - w * 0.03);
  ctx.textAlign = "left";
}

// Helper to create a lighter/transparent version of a hex color
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ==================== BOLD ====================

function drawBoldTemplate(ctx: CanvasRenderingContext2D, w: number, h: number, d: CreativeData, cols: ColorConfig) {
  const topGrad = ctx.createLinearGradient(0, 0, 0, h * 0.25);
  topGrad.addColorStop(0, "rgba(0,0,0,0.5)");
  topGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, w, h * 0.25);

  const barH = h * 0.35;
  const grad = ctx.createLinearGradient(0, h - barH, 0, h);
  grad.addColorStop(0, hexToRgba(cols.accent, 0));
  grad.addColorStop(0.15, hexToRgba(cols.accent, 0.6));
  grad.addColorStop(0.4, hexToRgba(cols.accent, 0.9));
  grad.addColorStop(1, hexToRgba(cols.accent, 0.97));
  ctx.fillStyle = grad;
  ctx.fillRect(0, h - barH, w, barH);

  const pad = w * 0.06;

  const accentGrad = ctx.createLinearGradient(pad, 0, pad + w * 0.25, 0);
  accentGrad.addColorStop(0, cols.primary);
  accentGrad.addColorStop(1, hexToRgba(cols.primary, 0));
  ctx.fillStyle = accentGrad;
  ctx.fillRect(pad, h - barH + barH * 0.06, w * 0.25, 3);

  let y = h - barH + barH * 0.16;

  if (d.headline) {
    ctx.textAlign = "left";
    ctx.font = `800 ${w * 0.058}px 'Space Grotesk', sans-serif`;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    wrapText(ctx, d.headline.toUpperCase(), pad + 2, y + 2, w - pad * 2 - w * 0.38, w * 0.068);
    ctx.fillStyle = "#ffffff";
    y = wrapText(ctx, d.headline.toUpperCase(), pad, y, w - pad * 2 - w * 0.38, w * 0.068);
    y += w * 0.025;
  }

  if (d.subtext) {
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = `400 ${w * 0.03}px Inter, sans-serif`;
    ctx.fillText(d.subtext, pad, y + w * 0.015);
    y += w * 0.05;
  }

  if (d.price) {
    drawPill(ctx, d.price, pad, y + w * 0.04, w * 0.035, cols.primary, cols.accent);
    y += w * 0.06;
  }

  if (d.location) {
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = `500 ${w * 0.024}px Inter, sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText("📍 " + d.location, pad, h - pad * 0.8);
  }

  if (d.cta) {
    const ctaW = w * 0.34;
    const ctaH = w * 0.072;
    const ctaX = w - pad - ctaW;
    const ctaY = h - pad - ctaH;
    const ctaGrad = ctx.createLinearGradient(ctaX, ctaY, ctaX + ctaW, ctaY + ctaH);
    ctaGrad.addColorStop(0, cols.primary);
    ctaGrad.addColorStop(1, hexToRgba(cols.primary, 0.85));
    ctx.fillStyle = ctaGrad;
    roundRect(ctx, ctaX, ctaY, ctaW, ctaH, 8);
    ctx.fill();
    ctx.shadowColor = hexToRgba(cols.primary, 0.3);
    ctx.shadowBlur = w * 0.02;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.fillStyle = cols.accent;
    ctx.font = `700 ${w * 0.026}px 'Space Grotesk', sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(d.cta.toUpperCase(), ctaX + ctaW / 2, ctaY + ctaH / 2 + w * 0.008);
    ctx.textAlign = "left";
  }

  drawBrandWatermark(ctx, w, h * 0.65, d.brand, "rgba(255,255,255,0.3)");
}

// ==================== MINIMAL ====================

function drawMinimalTemplate(ctx: CanvasRenderingContext2D, w: number, h: number, d: CreativeData, cols: ColorConfig) {
  const radGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.1, w / 2, h / 2, w * 0.9);
  radGrad.addColorStop(0, "rgba(0,0,0,0.25)");
  radGrad.addColorStop(1, "rgba(0,0,0,0.65)");
  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, w, h);

  const pad = w * 0.08;

  if (d.brand) {
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = `600 ${w * 0.024}px 'Space Grotesk', sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(d.brand.toUpperCase(), pad, pad + w * 0.02);
    ctx.fillStyle = cols.primary;
    ctx.beginPath();
    ctx.arc(pad + ctx.measureText(d.brand.toUpperCase()).width + w * 0.015, pad + w * 0.012, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  if (d.headline) {
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 ${w * 0.058}px 'Space Grotesk', sans-serif`;
    ctx.textAlign = "center";
    wrapText(ctx, d.headline, w / 2, h * 0.38, w - pad * 2, w * 0.072);
  }

  const lineGrad = ctx.createLinearGradient(w * 0.25, 0, w * 0.75, 0);
  lineGrad.addColorStop(0, hexToRgba(cols.primary, 0));
  lineGrad.addColorStop(0.5, hexToRgba(cols.primary, 0.8));
  lineGrad.addColorStop(1, hexToRgba(cols.primary, 0));
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.25, h * 0.5);
  ctx.lineTo(w * 0.75, h * 0.5);
  ctx.stroke();

  ctx.fillStyle = cols.primary;
  ctx.save();
  ctx.translate(w / 2, h * 0.5);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-4, -4, 8, 8);
  ctx.restore();

  if (d.subtext) {
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = `400 ${w * 0.028}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(d.subtext, w / 2, h * 0.57);
  }

  if (d.price) {
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 ${w * 0.044}px 'Space Grotesk', sans-serif`;
    ctx.fillText(d.price, w / 2, h * 0.66);
  }

  if (d.location) {
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = `500 ${w * 0.024}px Inter, sans-serif`;
    ctx.fillText("📍 " + d.location, w / 2, h * 0.73);
  }

  if (d.cta) {
    const ctaW = w * 0.4;
    const ctaH = w * 0.07;
    const ctaX = (w - ctaW) / 2;
    const ctaY = h * 0.8;
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, ctaX, ctaY, ctaW, ctaH, ctaH / 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    roundRect(ctx, ctaX, ctaY, ctaW, ctaH, ctaH / 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = `600 ${w * 0.024}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(d.cta.toUpperCase(), w / 2, ctaY + ctaH / 2 + w * 0.007);
  }

  ctx.textAlign = "left";
}

// ==================== GRADIENT ====================

function drawGradientTemplate(ctx: CanvasRenderingContext2D, w: number, h: number, d: CreativeData, cols: ColorConfig) {
  const panelW = w * 0.48;
  const grad = ctx.createLinearGradient(0, 0, panelW * 1.2, h);
  grad.addColorStop(0, hexToRgba(cols.accent, 0.97));
  grad.addColorStop(0.6, hexToRgba(cols.accent, 0.85));
  grad.addColorStop(1, hexToRgba(cols.accent, 0));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, panelW * 1.2, h);

  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  for (let i = 0; i < h; i += w * 0.06) {
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(panelW * 0.8, i); ctx.stroke();
  }

  const pad = w * 0.055;
  let y = h * 0.18;

  if (d.brand) {
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = `600 ${w * 0.02}px 'Space Grotesk', sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(d.brand.toUpperCase(), pad, y);
    y += w * 0.05;
  }

  ctx.fillStyle = cols.primary;
  ctx.fillRect(pad, y - w * 0.01, 4, w * 0.08);

  if (d.headline) {
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 ${w * 0.05}px 'Space Grotesk', sans-serif`;
    ctx.textAlign = "left";
    y = wrapText(ctx, d.headline.toUpperCase(), pad + w * 0.025, y + w * 0.02, panelW - pad * 2, w * 0.06);
    y += w * 0.04;
  }

  if (d.subtext) {
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = `400 ${w * 0.026}px Inter, sans-serif`;
    wrapText(ctx, d.subtext, pad, y, panelW - pad * 1.5, w * 0.036);
    y += w * 0.08;
  }

  if (d.price) {
    drawPill(ctx, d.price, pad, y + w * 0.03, w * 0.032, cols.primary, cols.accent);
    y += w * 0.07;
  }

  if (d.location) {
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = `500 ${w * 0.022}px Inter, sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText("📍 " + d.location, pad, y + w * 0.02);
  }

  if (d.cta) {
    const ctaY = h * 0.84;
    const ctaW2 = panelW * 0.6;
    const ctaH2 = w * 0.06;
    const ctaGrad = ctx.createLinearGradient(pad, ctaY, pad + ctaW2, ctaY);
    ctaGrad.addColorStop(0, cols.primary);
    ctaGrad.addColorStop(1, hexToRgba(cols.primary, 0.85));
    ctx.fillStyle = ctaGrad;
    roundRect(ctx, pad, ctaY, ctaW2, ctaH2, 8);
    ctx.fill();
    ctx.fillStyle = cols.accent;
    ctx.font = `700 ${w * 0.022}px 'Space Grotesk', sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(d.cta.toUpperCase(), pad + ctaW2 / 2, ctaY + ctaH2 / 2 + w * 0.007);
    ctx.textAlign = "left";
  }
}

// ==================== DARK ====================

function drawDarkTemplate(ctx: CanvasRenderingContext2D, w: number, h: number, d: CreativeData, cols: ColorConfig) {
  const radGrad = ctx.createRadialGradient(w / 2, h * 0.4, w * 0.15, w / 2, h / 2, w);
  radGrad.addColorStop(0, "rgba(0,0,0,0.45)");
  radGrad.addColorStop(1, "rgba(0,0,0,0.75)");
  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, w, h);

  const pad = w * 0.07;

  const lineGrad = ctx.createLinearGradient(0, 0, w, 0);
  lineGrad.addColorStop(0, hexToRgba(cols.primary, 0.2));
  lineGrad.addColorStop(0.5, cols.primary);
  lineGrad.addColorStop(1, hexToRgba(cols.primary, 0.2));
  ctx.fillStyle = lineGrad;
  ctx.fillRect(0, 0, w, 4);
  ctx.fillRect(0, h - 4, w, 4);

  const cornerSize = w * 0.06;
  ctx.strokeStyle = cols.primary;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(pad, pad + cornerSize); ctx.lineTo(pad, pad); ctx.lineTo(pad + cornerSize, pad); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w - pad - cornerSize, pad); ctx.lineTo(w - pad, pad); ctx.lineTo(w - pad, pad + cornerSize); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(pad, h - pad - cornerSize); ctx.lineTo(pad, h - pad); ctx.lineTo(pad + cornerSize, h - pad); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w - pad - cornerSize, h - pad); ctx.lineTo(w - pad, h - pad); ctx.lineTo(w - pad, h - pad - cornerSize); ctx.stroke();

  if (d.brand) {
    ctx.fillStyle = cols.primary;
    ctx.font = `600 ${w * 0.02}px 'Space Grotesk', sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(d.brand.toUpperCase(), w / 2, pad + w * 0.04);
  }

  if (d.location) {
    ctx.fillStyle = hexToRgba(cols.primary, 0.7);
    ctx.font = `500 ${w * 0.022}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("📍 " + d.location, w / 2, pad + w * 0.07);
  }

  if (d.headline) {
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 ${w * 0.06}px 'Space Grotesk', sans-serif`;
    ctx.textAlign = "center";
    wrapText(ctx, d.headline.toUpperCase(), w / 2, h * 0.37, w - pad * 3, w * 0.075);
  }

  ctx.fillStyle = cols.primary;
  roundRect(ctx, w * 0.38, h * 0.52, w * 0.24, 3, 2);
  ctx.fill();

  if (d.subtext) {
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = `400 ${w * 0.028}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(d.subtext, w / 2, h * 0.59);
  }

  if (d.price) {
    ctx.fillStyle = cols.primary;
    ctx.font = `700 ${w * 0.048}px 'Space Grotesk', sans-serif`;
    ctx.fillText(d.price, w / 2, h * 0.69);
  }

  if (d.cta) {
    const ctaW2 = w * 0.44;
    const ctaH2 = w * 0.072;
    const ctaX = (w - ctaW2) / 2;
    const ctaY = h * 0.78;
    const ctaGrad = ctx.createLinearGradient(ctaX, ctaY, ctaX + ctaW2, ctaY + ctaH2);
    ctaGrad.addColorStop(0, cols.primary);
    ctaGrad.addColorStop(1, hexToRgba(cols.primary, 0.8));
    ctx.fillStyle = ctaGrad;
    roundRect(ctx, ctaX, ctaY, ctaW2, ctaH2, 8);
    ctx.fill();
    ctx.fillStyle = "#000000";
    ctx.font = `700 ${w * 0.028}px 'Space Grotesk', sans-serif`;
    ctx.fillText(d.cta.toUpperCase(), w / 2, ctaY + ctaH2 / 2 + w * 0.009);
  }

  ctx.textAlign = "left";
}

// ==================== LUXURY ====================

function drawLuxuryTemplate(ctx: CanvasRenderingContext2D, w: number, h: number, d: CreativeData, cols: ColorConfig) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "rgba(20, 15, 10, 0.3)");
  grad.addColorStop(0.5, "rgba(20, 15, 10, 0.15)");
  grad.addColorStop(1, "rgba(20, 15, 10, 0.7)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const pad = w * 0.08;
  const gold = cols.primary;
  const goldLight = hexToRgba(cols.primary, 0.4);

  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;
  roundRect(ctx, pad * 0.7, pad * 0.7, w - pad * 1.4, h - pad * 1.4, 2);
  ctx.stroke();

  ctx.strokeStyle = goldLight;
  ctx.lineWidth = 1;
  roundRect(ctx, pad, pad, w - pad * 2, h - pad * 2, 2);
  ctx.stroke();

  if (d.brand) {
    const brandY = pad * 1.7;
    ctx.fillStyle = gold;
    ctx.font = `600 ${w * 0.022}px 'Space Grotesk', sans-serif`;
    ctx.textAlign = "center";
    const bw = ctx.measureText(d.brand.toUpperCase()).width;
    ctx.fillText(d.brand.toUpperCase(), w / 2, brandY);
    ctx.strokeStyle = goldLight;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(w / 2 - bw / 2 - w * 0.06, brandY - w * 0.006); ctx.lineTo(w / 2 - bw / 2 - w * 0.01, brandY - w * 0.006); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w / 2 + bw / 2 + w * 0.01, brandY - w * 0.006); ctx.lineTo(w / 2 + bw / 2 + w * 0.06, brandY - w * 0.006); ctx.stroke();
  }

  if (d.headline) {
    ctx.fillStyle = "#ffffff";
    ctx.font = `300 ${w * 0.055}px 'Space Grotesk', sans-serif`;
    ctx.textAlign = "center";
    wrapText(ctx, d.headline.toUpperCase(), w / 2, h * 0.37, w - pad * 3, w * 0.07);
  }

  ctx.fillStyle = gold;
  const oy = h * 0.51;
  ctx.save();
  ctx.translate(w / 2, oy);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-5, -5, 10, 10);
  ctx.restore();
  ctx.strokeStyle = goldLight;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(w * 0.3, oy); ctx.lineTo(w / 2 - 12, oy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w / 2 + 12, oy); ctx.lineTo(w * 0.7, oy); ctx.stroke();

  if (d.subtext) {
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = `300 ${w * 0.026}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(d.subtext, w / 2, h * 0.58);
  }

  if (d.price) {
    ctx.fillStyle = gold;
    ctx.font = `600 ${w * 0.045}px 'Space Grotesk', sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(d.price, w / 2, h * 0.67);
  }

  if (d.location) {
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = `400 ${w * 0.022}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("📍 " + d.location, w / 2, h * 0.735);
  }

  if (d.cta) {
    const ctaW2 = w * 0.4;
    const ctaH2 = w * 0.065;
    const ctaX = (w - ctaW2) / 2;
    const ctaY = h * 0.8;
    ctx.strokeStyle = gold;
    ctx.lineWidth = 1.5;
    roundRect(ctx, ctaX, ctaY, ctaW2, ctaH2, 2);
    ctx.stroke();
    ctx.fillStyle = gold;
    ctx.font = `600 ${w * 0.022}px 'Space Grotesk', sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(d.cta.toUpperCase(), w / 2, ctaY + ctaH2 / 2 + w * 0.006);
  }

  ctx.textAlign = "left";
}

// ==================== NEON ====================

function drawNeonTemplate(ctx: CanvasRenderingContext2D, w: number, h: number, d: CreativeData, cols: ColorConfig) {
  ctx.fillStyle = "rgba(5, 5, 15, 0.7)";
  ctx.fillRect(0, 0, w, h);

  const pad = w * 0.07;
  const neonBlue = cols.primary;
  const neonPink = cols.accent === "#ffffff" ? "#ff3cac" : cols.accent;

  const glowGrad = ctx.createRadialGradient(w * 0.85, h * 0.1, 0, w * 0.85, h * 0.1, w * 0.35);
  glowGrad.addColorStop(0, hexToRgba(neonBlue, 0.15));
  glowGrad.addColorStop(1, hexToRgba(neonBlue, 0));
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, w, h);

  const glowGrad2 = ctx.createRadialGradient(w * 0.15, h * 0.9, 0, w * 0.15, h * 0.9, w * 0.35);
  glowGrad2.addColorStop(0, hexToRgba(neonPink, 0.12));
  glowGrad2.addColorStop(1, hexToRgba(neonPink, 0));
  ctx.fillStyle = glowGrad2;
  ctx.fillRect(0, 0, w, h);

  if (d.brand) {
    ctx.fillStyle = neonBlue;
    ctx.font = `700 ${w * 0.022}px 'Space Grotesk', sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(d.brand.toUpperCase(), pad, pad + w * 0.03);
  }

  if (d.location) {
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = `500 ${w * 0.02}px Inter, sans-serif`;
    ctx.textAlign = "right";
    ctx.fillText("📍 " + d.location, w - pad, pad + w * 0.03);
    ctx.textAlign = "left";
  }

  if (d.headline) {
    ctx.textAlign = "center";
    ctx.font = `800 ${w * 0.06}px 'Space Grotesk', sans-serif`;
    ctx.shadowColor = neonBlue;
    ctx.shadowBlur = w * 0.025;
    ctx.fillStyle = "#ffffff";
    wrapText(ctx, d.headline.toUpperCase(), w / 2, h * 0.37, w - pad * 2.5, w * 0.075);
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
  }

  const lgY = h * 0.52;
  const lineG = ctx.createLinearGradient(w * 0.2, lgY, w * 0.8, lgY);
  lineG.addColorStop(0, neonPink);
  lineG.addColorStop(0.5, neonBlue);
  lineG.addColorStop(1, neonPink);
  ctx.strokeStyle = lineG;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(w * 0.2, lgY); ctx.lineTo(w * 0.8, lgY); ctx.stroke();

  if (d.subtext) {
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = `400 ${w * 0.028}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(d.subtext, w / 2, h * 0.59);
  }

  if (d.price) {
    ctx.shadowColor = neonBlue;
    ctx.shadowBlur = w * 0.015;
    ctx.fillStyle = neonBlue;
    ctx.font = `700 ${w * 0.048}px 'Space Grotesk', sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(d.price, w / 2, h * 0.68);
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
  }

  if (d.cta) {
    const ctaW2 = w * 0.42;
    const ctaH2 = w * 0.072;
    const ctaX = (w - ctaW2) / 2;
    const ctaY = h * 0.78;
    ctx.shadowColor = neonBlue;
    ctx.shadowBlur = w * 0.02;
    const ctaBg = ctx.createLinearGradient(ctaX, ctaY, ctaX + ctaW2, ctaY);
    ctaBg.addColorStop(0, neonBlue);
    ctaBg.addColorStop(1, hexToRgba(neonBlue, 0.7));
    ctx.fillStyle = ctaBg;
    roundRect(ctx, ctaX, ctaY, ctaW2, ctaH2, ctaH2 / 2);
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#000";
    ctx.font = `700 ${w * 0.026}px 'Space Grotesk', sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(d.cta.toUpperCase(), w / 2, ctaY + ctaH2 / 2 + w * 0.008);
  }

  ctx.textAlign = "left";
}

export default CreativeGenerator;
