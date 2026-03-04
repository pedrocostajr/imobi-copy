import { useState } from "react";
import { Zap, Settings2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CopyFormData,
  TIPO_OPTIONS,
  VALOR_OPTIONS,
  PUBLICO_OPTIONS,
  ESTAGIO_OPTIONS,
  OBJETIVO_OPTIONS,
  TOM_OPTIONS,
  PARCELAS_OPTIONS,
} from "@/lib/copy-types";

interface CopyFormProps {
  onSubmit: (data: CopyFormData) => void;
  isLoading: boolean;
}

const CopyForm = ({ onSubmit, isLoading }: CopyFormProps) => {
  const [form, setForm] = useState<CopyFormData>({
    tipo: "",
    cidade: "",
    bairro: "",
    valor: "",
    valorPersonalizado: "",
    temEntrada: false,
    entrada: "",
    parcelas: "",
    publico: "",
    diferencial: "",
    estagio: "",
    objetivo: "",
    tom: "",
    modoAvancado: false,
  });

  const update = (key: keyof CopyFormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const [attempted, setAttempted] = useState(false);

  const isValid =
    form.tipo && form.cidade && form.bairro && (form.valor && (form.valor !== "Personalizado" || form.valorPersonalizado)) && form.publico && form.estagio && form.objetivo && form.tom;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (isValid) onSubmit(form);
  };

  const missing = (val: string) => attempted && !val;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Property Info Card */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Building2Icon />
          Dados do Imóvel
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SelectField label="Tipo de imóvel *" value={form.tipo} onChange={(v) => update("tipo", v)} options={TIPO_OPTIONS} placeholder="Selecione" error={missing(form.tipo)} />
          <div>
            <Label className="text-sm text-foreground mb-1.5 block">Cidade *</Label>
            <Input placeholder="Ex: São Paulo" value={form.cidade} onChange={(e) => update("cidade", e.target.value)} className={`bg-background ${missing(form.cidade) ? "border-destructive" : ""}`} />
            {missing(form.cidade) && <span className="text-xs text-destructive mt-1">Obrigatório</span>}
          </div>
          <div>
            <Label className="text-sm text-foreground mb-1.5 block">Bairro *</Label>
            <Input placeholder="Ex: Vila Olímpia" value={form.bairro} onChange={(e) => update("bairro", e.target.value)} className={`bg-background ${missing(form.bairro) ? "border-destructive" : ""}`} />
            {missing(form.bairro) && <span className="text-xs text-destructive mt-1">Obrigatório</span>}
          </div>
          <SelectField label="Estágio do imóvel *" value={form.estagio} onChange={(v) => update("estagio", v)} options={ESTAGIO_OPTIONS} placeholder="Selecione" error={missing(form.estagio)} />
          <div>
            <Label className="text-sm text-foreground mb-1.5 block">Diferencial principal</Label>
            <Input placeholder="Ex: Vista panorâmica" value={form.diferencial} onChange={(e) => update("diferencial", e.target.value)} className="bg-background" />
          </div>
        </div>
      </div>

      {/* Value & Payment Card */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <DollarSign className="h-[18px] w-[18px] text-primary" />
          Valor e Condições
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SelectField label="Faixa de valor *" value={form.valor} onChange={(v) => { update("valor", v); if (v !== "Personalizado") update("valorPersonalizado", ""); }} options={VALOR_OPTIONS} placeholder="Selecione" error={missing(form.valor)} />
          
          {form.valor === "Personalizado" && (
            <div>
              <Label className="text-sm text-foreground mb-1.5 block">Valor personalizado</Label>
              <Input placeholder="Ex: R$ 450.000" value={form.valorPersonalizado} onChange={(e) => update("valorPersonalizado", e.target.value)} className="bg-background" />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-3 cursor-pointer mt-6">
              <Switch checked={form.temEntrada} onCheckedChange={(v) => { update("temEntrada", v); if (!v) update("entrada", ""); }} />
              <span className="text-sm text-foreground font-medium">Tem entrada?</span>
            </label>
          </div>

          {form.temEntrada && (
            <div>
              <Label className="text-sm text-foreground mb-1.5 block">Valor da entrada</Label>
              <Input placeholder="Ex: R$ 50.000" value={form.entrada} onChange={(e) => update("entrada", e.target.value)} className="bg-background" />
            </div>
          )}

          <SelectField label="Parcelas do saldo" value={form.parcelas} onChange={(v) => update("parcelas", v)} options={PARCELAS_OPTIONS} placeholder="Selecione" />
        </div>
      </div>

      {/* Campaign Card */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <TargetIcon />
          Campanha
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SelectField label="Público-alvo *" value={form.publico} onChange={(v) => update("publico", v)} options={PUBLICO_OPTIONS} placeholder="Selecione" error={missing(form.publico)} />
          <SelectField label="Objetivo *" value={form.objetivo} onChange={(v) => update("objetivo", v)} options={OBJETIVO_OPTIONS} placeholder="Selecione" error={missing(form.objetivo)} />
          <SelectField label="Tom da comunicação *" value={form.tom} onChange={(v) => update("tom", v)} options={TOM_OPTIONS} placeholder="Selecione" error={missing(form.tom)} />
        </div>
      </div>

      {/* Advanced Mode + Submit */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <label className="flex items-center gap-3 cursor-pointer glass-card rounded-lg px-4 py-3">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-foreground font-medium">Modo Avançado</span>
          <Switch checked={form.modoAvancado} onCheckedChange={(v) => update("modoAvancado", v)} />
          <span className="text-xs text-muted-foreground">(3 headlines + 2 CTAs + Roteiro Reels)</span>
        </label>

        <Button
          type="submit"
          disabled={!isValid || isLoading}
          className="gradient-primary text-primary-foreground font-semibold px-8 py-3 h-auto text-base rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 animate-pulse-glow w-full sm:w-auto"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Gerando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Gerar Copy Agora
            </span>
          )}
        </Button>
      </div>
    </form>
  );
};

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  error?: boolean;
}) {
  return (
    <div>
      <Label className="text-sm text-foreground mb-1.5 block">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={`bg-background ${error ? "border-destructive" : ""}`}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <span className="text-xs text-destructive mt-1">Obrigatório</span>}
    </div>
  );
}

function Building2Icon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>
  );
}

function TargetIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
  );
}

export default CopyForm;
