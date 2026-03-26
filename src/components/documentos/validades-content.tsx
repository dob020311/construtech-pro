"use client";

import { trpc } from "@/lib/trpc";
import { AlertTriangle, CheckCircle2, Clock, XCircle, Bell, Calendar, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface AlertPrefs { days30: boolean; days60: boolean; days90: boolean; email: boolean }

function AlertModal({ onClose }: { onClose: () => void }) {
  const [prefs, setPrefs] = useState<AlertPrefs>({ days30: true, days60: true, days90: false, email: false });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("docAlertPrefs");
      if (saved) setPrefs(JSON.parse(saved));
    } catch {}
  }, []);

  const save = () => {
    localStorage.setItem("docAlertPrefs", JSON.stringify(prefs));
    onClose();
  };

  const toggle = (k: keyof AlertPrefs) => setPrefs(p => ({ ...p, [k]: !p[k] }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h2 className="font-heading font-semibold text-sm">Configurar Alertas</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-muted-foreground">Receba alertas quando documentos estiverem prestes a vencer:</p>
          <div className="space-y-3">
            {([
              { key: "days30", label: "30 dias antes do vencimento" },
              { key: "days60", label: "60 dias antes do vencimento" },
              { key: "days90", label: "90 dias antes do vencimento" },
              { key: "email", label: "Notificar também por e-mail" },
            ] as { key: keyof AlertPrefs; label: string }[]).map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => toggle(key)}
                  className={cn(
                    "w-10 h-5 rounded-full transition-colors flex items-center px-0.5 cursor-pointer",
                    prefs[key] ? "bg-primary" : "bg-muted"
                  )}
                >
                  <div className={cn("w-4 h-4 rounded-full bg-white shadow transition-transform", prefs[key] ? "translate-x-5" : "translate-x-0")} />
                </div>
                <span className="text-sm text-foreground">{label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-border">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Cancelar</button>
          <button onClick={save} className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">Salvar</button>
        </div>
      </div>
    </div>
  );
}

const DOC_TYPE_LABELS: Record<string, string> = {
  CNPJ: "CNPJ",
  CERTIDAO_FEDERAL: "Certidão Federal",
  CERTIDAO_ESTADUAL: "Certidão Estadual",
  CERTIDAO_MUNICIPAL: "Certidão Municipal",
  CERTIDAO_TRABALHISTA: "Certidão Trabalhista",
  CERTIDAO_FGTS: "Certidão FGTS",
  REGISTRO_CREA: "Registro CREA",
  BALANÇO_PATRIMONIAL: "Balanço Patrimonial",
  CONTRATO_SOCIAL: "Contrato Social",
  OUTROS: "Outros",
};

const STATUS_CONFIG = {
  VALID: { label: "Válido", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800" },
  EXPIRING: { label: "Vencendo", icon: Clock, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-800" },
  EXPIRED: { label: "Vencido", icon: XCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800" },
  PENDING: { label: "Pendente", icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950/30", border: "border-yellow-200 dark:border-yellow-800" },
};

export function ValidadesContent() {
  const [filter, setFilter] = useState<"ALL" | "EXPIRING" | "EXPIRED" | "VALID">("ALL");
  const [showAlerts, setShowAlerts] = useState(false);

  const { data: expiring, isLoading: loadingExp } = trpc.documento.getExpiringDocuments.useQuery();
  const { data: stats } = trpc.documento.getDocumentStats.useQuery();
  const { data: docs, isLoading: loadingDocs } = trpc.documento.list.useQuery({
    status: filter === "ALL" ? undefined : (filter as "EXPIRING" | "EXPIRED" | "VALID"),
    limit: 50,
  });

  const loading = loadingExp || loadingDocs;

  const getDaysUntilExpiry = (date: Date | string | null) => {
    if (!date) return null;
    return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Validades</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Controle de vencimento de certidões e documentos habilitatórios
          </p>
        </div>
        <button
          onClick={() => setShowAlerts(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          <Bell className="w-4 h-4" />
          Configurar alertas
        </button>
        {showAlerts && <AlertModal onClose={() => setShowAlerts(false)} />}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const count =
            key === "VALID" ? stats?.valid :
            key === "EXPIRING" ? stats?.expiring :
            key === "EXPIRED" ? stats?.expired :
            stats?.pending;
          const Icon = cfg.icon;
          return (
            <button
              key={key}
              onClick={() => setFilter(filter === key ? "ALL" : key as any)}
              className={cn(
                "rounded-xl p-4 border text-left transition-all hover:shadow-sm",
                cfg.bg, cfg.border,
                filter === key && "ring-2 ring-primary"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn("w-4 h-4", cfg.color)} />
                <span className="text-xs font-medium text-muted-foreground">{cfg.label}</span>
              </div>
              <p className={cn("text-3xl font-heading font-bold", cfg.color)}>
                {count ?? 0}
              </p>
            </button>
          );
        })}
      </div>

      {/* Alertas urgentes */}
      {!loadingExp && expiring && expiring.filter(d => {
        const days = getDaysUntilExpiry(d.expirationDate);
        return days !== null && days <= 7;
      }).length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-semibold text-red-700 dark:text-red-400">
              Atenção urgente — documentos vencendo em menos de 7 dias
            </span>
          </div>
          <div className="space-y-2">
            {expiring.filter(d => {
              const days = getDaysUntilExpiry(d.expirationDate);
              return days !== null && days <= 7;
            }).map(doc => {
              const days = getDaysUntilExpiry(doc.expirationDate);
              return (
                <div key={doc.id} className="flex items-center justify-between bg-white dark:bg-red-950/30 rounded-lg px-3 py-2">
                  <div>
                    <span className="text-sm font-medium text-foreground">{doc.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {DOC_TYPE_LABELS[doc.type] ?? doc.type}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-red-600 dark:text-red-400">
                    {days !== null && days <= 0 ? "VENCIDO" : `${days}d restantes`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabela de documentos */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h2 className="font-heading font-semibold text-foreground">
            {filter === "ALL" ? "Todos os Documentos" : `Documentos — ${STATUS_CONFIG[filter as keyof typeof STATUS_CONFIG]?.label}`}
          </h2>
          <span className="ml-auto text-xs text-muted-foreground">{docs?.total ?? 0} documentos</span>
        </div>

        {loading ? (
          <div className="divide-y divide-border">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="px-6 py-4 flex gap-4 animate-pulse">
                <div className="h-4 w-48 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded ml-auto" />
              </div>
            ))}
          </div>
        ) : docs?.items.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum documento nesta categoria</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {docs?.items.map((doc) => {
              const days = getDaysUntilExpiry(doc.expirationDate);
              const cfg = STATUS_CONFIG[doc.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.VALID;
              const Icon = cfg.icon;
              return (
                <div key={doc.id} className="px-6 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                  <Icon className={cn("w-4 h-4 flex-shrink-0", cfg.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{DOC_TYPE_LABELS[doc.type] ?? doc.type}</p>
                  </div>
                  {doc.expirationDate ? (
                    <div className="text-right">
                      <p className="text-sm text-foreground">
                        {new Date(doc.expirationDate).toLocaleDateString("pt-BR")}
                      </p>
                      <p className={cn("text-xs font-medium", cfg.color)}>
                        {days === null ? "" : days <= 0 ? "Vencido" : `${days} dias`}
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Sem validade</span>
                  )}
                  <span className={cn(
                    "text-xs font-semibold px-2 py-1 rounded-full border",
                    cfg.bg, cfg.border, cfg.color
                  )}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
