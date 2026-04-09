"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { KpiCard } from "./kpi-card";
import { PipelineFunnelChart } from "./pipeline-funnel-chart";
import { UpcomingDeadlines } from "./upcoming-deadlines";
import { RecentActivities } from "./recent-activities";
import { DocumentStatusWidget } from "./document-status-widget";
import {
  FileText,
  Calculator,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  X,
  Plus,
  Upload,
  Bot,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

const ONBOARDING_KEY = "onboarding_dismissed_v1";

const STEPS = [
  {
    icon: FileText,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    title: "Cadastre sua primeira licitação",
    desc: "Registre editais identificados para acompanhar o processo completo.",
    href: "/licitacoes",
    cta: "Ir para Licitações",
  },
  {
    icon: Upload,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    title: "Envie documentos habilitatórios",
    desc: "Mantenha certidões, CNPJ e atestados organizados e com alertas de validade.",
    href: "/documentos",
    cta: "Ir para Documentos",
  },
  {
    icon: Bot,
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    title: "Configure um agente RPA",
    desc: "Deixe o sistema buscar editais automaticamente nos portais públicos.",
    href: "/rpa",
    cta: "Ir para Agentes RPA",
  },
  {
    icon: Calculator,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    title: "Crie um orçamento",
    desc: "Monte proposta com capítulos, itens SINAPI, BDI e análise de curva ABC.",
    href: "/orcamentos",
    cta: "Ir para Orçamentos",
  },
];

function OnboardingBanner({ totalLicitacoes }: { totalLicitacoes: number }) {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(ONBOARDING_KEY) === "1"; } catch { return false; }
  });

  const dismiss = () => {
    try { localStorage.setItem(ONBOARDING_KEY, "1"); } catch {}
    setDismissed(true);
  };

  if (dismissed || totalLicitacoes >= 3) return null;

  const done = Math.min(totalLicitacoes, STEPS.length);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Plus className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-sm text-foreground">Primeiros passos</h2>
            <p className="text-xs text-muted-foreground">{done} de {STEPS.length} etapas concluídas</p>
          </div>
        </div>
        <button onClick={dismiss} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div className="h-1 bg-primary transition-all" style={{ width: `${(done / STEPS.length) * 100}%` }} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
        {STEPS.map((step, i) => {
          const complete = i < done;
          const Icon = step.icon;
          return (
            <Link key={step.href} href={step.href}
              className={cn("flex flex-col gap-3 p-4 hover:bg-muted/30 transition-colors group",
                complete && "opacity-60")}>
              <div className="flex items-center justify-between">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", step.bg)}>
                  {complete
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    : <Icon className={cn("w-4 h-4", step.color)} />}
                </div>
                {complete
                  ? <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">Feito</span>
                  : <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{step.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
              {!complete && (
                <span className={cn("text-[11px] font-medium", step.color)}>{step.cta} →</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function OrcamentoDashboard() {
  const { data: orc, isLoading } = trpc.orcamento.getDashboardStats.useQuery();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-3 animate-pulse">
        <div className="h-4 w-40 bg-muted rounded" />
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-5 bg-muted rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Curva ABC — Orçamentos</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{orc?.totalOrcamentos ?? 0} orçamentos</p>
          <p className="text-xs font-semibold text-primary">
            R$ {(orc?.totalValorBdi ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {!orc?.curvaABC.length ? (
        <p className="text-xs text-muted-foreground text-center py-4">Nenhum item cadastrado</p>
      ) : (
        <div className="space-y-2">
          {orc.curvaABC.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className={`text-[10px] font-bold w-4 flex-shrink-0 ${
                item.classe === "A" ? "text-red-400" :
                item.classe === "B" ? "text-amber-400" : "text-emerald-400"
              }`}>{item.classe}</span>
              <span className="text-xs text-muted-foreground flex-1 truncate">{item.description}</span>
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden flex-shrink-0">
                <div
                  className={`h-full rounded-full ${item.classe === "A" ? "bg-red-400" : item.classe === "B" ? "bg-amber-400" : "bg-emerald-400"}`}
                  style={{ width: `${Math.min(item.pct * 3, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground w-10 text-right flex-shrink-0">
                {item.pct.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 pt-1 border-t border-border">
        {(["A", "B", "C"] as const).map((cls) => (
          <div key={cls} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${cls === "A" ? "bg-red-400" : cls === "B" ? "bg-amber-400" : "bg-emerald-400"}`} />
            <span className="text-[10px] text-muted-foreground">Classe {cls}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardContent() {
  const { data: stats, isLoading: statsLoading } = trpc.licitacao.getStats.useQuery();
  const { data: deadlines, isLoading: deadlinesLoading } =
    trpc.licitacao.getUpcomingDeadlines.useQuery();
  const { data: docStats, isLoading: docStatsLoading } =
    trpc.documento.getDocumentStats.useQuery();

  return (
    <div className="space-y-6">
      {/* Onboarding banner — shown until user has 3+ licitações or dismisses */}
      {!statsLoading && (
        <OnboardingBanner totalLicitacoes={stats?.totalActive ?? 0} />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Licitações Ativas"
          value={stats?.totalActive ?? 0}
          variation={stats?.totalActiveVariation}
          icon={FileText}
          iconColor="text-blue-600"
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          loading={statsLoading}
        />
        <KpiCard
          title="Ganhas este Mês"
          value={stats?.won ?? 0}
          variation={stats?.wonVariation}
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          loading={statsLoading}
          suffix=" licit."
        />
        <KpiCard
          title="Taxa de Sucesso"
          value={`${stats?.successRate?.toFixed(1) ?? 0}%`}
          icon={Calculator}
          iconColor="text-amber-600"
          iconBg="bg-amber-50 dark:bg-amber-900/20"
          loading={statsLoading}
          isPercentage
        />
        <KpiCard
          title="Pipeline Total"
          value={formatCurrency(stats?.pipelineValue ?? 0)}
          icon={DollarSign}
          iconColor="text-purple-600"
          iconBg="bg-purple-50 dark:bg-purple-900/20"
          loading={statsLoading}
          isCurrency
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline funnel - spans 2 cols */}
        <div className="lg:col-span-2">
          <PipelineFunnelChart byStatus={stats?.byStatus ?? []} loading={statsLoading} />
        </div>

        {/* Upcoming deadlines */}
        <div>
          <UpcomingDeadlines deadlines={deadlines ?? []} loading={deadlinesLoading} />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activities - spans 2 cols */}
        <div className="lg:col-span-2">
          <RecentActivities activities={stats?.recentActivities ?? []} loading={statsLoading} />
        </div>

        {/* Document status */}
        <div>
          <DocumentStatusWidget stats={docStats} loading={docStatsLoading} />
        </div>
      </div>

      {/* Orçamentos row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <OrcamentoDashboard />
        </div>
      </div>
    </div>
  );
}
