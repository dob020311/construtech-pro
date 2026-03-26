"use client";

import { trpc } from "@/lib/trpc";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import {
  BarChart3, TrendingUp, DollarSign, Trophy, FileText,
  Download, Calendar, AlertCircle, CheckCircle2, Clock, ArrowUpRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/* ── Status config ─────────────────────────────────────────────── */
const STATUS_LABELS: Record<string, string> = {
  IDENTIFIED: "Identificada",
  ANALYZING: "Analisando",
  GO: "Decisão GO",
  NO_GO: "No-GO",
  BUDGETING: "Orçando",
  PROPOSAL_SENT: "Proposta Enviada",
  WON: "Ganhou",
  LOST: "Perdeu",
  CANCELLED: "Cancelada",
};

const STATUS_COLORS: Record<string, string> = {
  IDENTIFIED: "#3b82f6",
  ANALYZING: "#eab308",
  GO: "#10b981",
  NO_GO: "#f87171",
  BUDGETING: "#f97316",
  PROPOSAL_SENT: "#a855f7",
  WON: "#059669",
  LOST: "#dc2626",
  CANCELLED: "#9ca3af",
};

const PIE_COLORS = ["#3b82f6", "#10b981", "#f97316", "#a855f7", "#eab308", "#f87171", "#059669", "#dc2626", "#9ca3af"];

/* ── Custom Tooltip ────────────────────────────────────────────── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
      {label && <p className="font-semibold text-foreground mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium text-foreground">
            {typeof p.value === "number" && p.value > 1000
              ? formatCurrency(p.value)
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────── */
export function RelatoriosContent() {
  const [months, setMonths] = useState<6 | 12>(6);

  const exportPDF = () => {
    const doc = new jsPDF();
    const now = new Date().toLocaleDateString("pt-BR");
    doc.setFontSize(16);
    doc.text("ConstruTech Pro — Relatório de Desempenho", 14, 18);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Gerado em ${now}`, 14, 25);
    doc.setTextColor(0);

    autoTable(doc, {
      startY: 32,
      head: [["Indicador", "Valor"]],
      body: [
        ["Licitações ativas", String(stats?.totalActive ?? 0)],
        ["Pipeline (valor)", formatCurrency(stats?.pipelineValue ?? 0)],
        ["Taxa de conversão", `${taxaConversao}%`],
        ["Ganhas / Perdidas", `${ganhou} / ${perdeu}`],
        ["Pipeline orçamentos", formatCurrency(pipelineTotal)],
        ["Documentos com atenção", String((docStats?.expiring ?? 0) + (docStats?.expired ?? 0))],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    if ((stats?.byStatus?.length ?? 0) > 0) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [["Status", "Qtd"]],
        body: (stats?.byStatus ?? []).map(s => [STATUS_LABELS[s.status] ?? s.status, String(s._count)]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [37, 99, 235] },
      });
    }

    if (topOrc.length > 0) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [["Orçamento", "Valor com BDI"]],
        body: topOrc.map(o => [o.name, formatCurrency(o.valor)]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [37, 99, 235] },
      });
    }

    doc.save(`relatorio-construtech-${now.replace(/\//g, "-")}.pdf`);
  };

  const { data: stats, isLoading: loadingStats } = trpc.licitacao.getStats.useQuery();
  const { data: trend, isLoading: loadingTrend } = trpc.licitacao.getMonthlyTrend.useQuery({ months });
  const { data: orcamentos, isLoading: loadingOrc } = trpc.orcamento.list.useQuery({ limit: 100 });
  const { data: docStats } = trpc.documento.getDocumentStats.useQuery();

  /* Derived values */
  const ganhou = stats?.byStatus?.find((s) => s.status === "WON")?._count ?? 0;
  const perdeu = stats?.byStatus?.find((s) => s.status === "LOST")?._count ?? 0;
  const taxaConversao = (ganhou + perdeu) > 0
    ? ((ganhou / (ganhou + perdeu)) * 100).toFixed(1)
    : "0.0";

  const pipelineTotal = orcamentos?.items
    .reduce((s, o) => s + Number(o.totalWithBdi ?? 0), 0) ?? 0;

  /* Status pie data */
  const pieData = (stats?.byStatus ?? [])
    .filter((s) => s._count > 0)
    .map((s) => ({ name: STATUS_LABELS[s.status] ?? s.status, value: s._count, status: s.status }));

  /* Top orçamentos */
  const topOrc = [...(orcamentos?.items ?? [])]
    .sort((a, b) => Number(b.totalWithBdi ?? 0) - Number(a.totalWithBdi ?? 0))
    .slice(0, 6)
    .map((o) => ({
      name: o.name.length > 20 ? o.name.slice(0, 20) + "…" : o.name,
      valor: Number(o.totalWithBdi ?? 0),
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Análise de desempenho e resultados da empresa
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border overflow-hidden text-sm">
            {([6, 12] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMonths(m)}
                className={`px-4 py-1.5 transition-colors ${
                  months === m ? "bg-primary text-white" : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {m === 6 ? "6 meses" : "12 meses"}
              </button>
            ))}
          </div>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<FileText className="w-5 h-5 text-blue-500" />}
          label="Licitações Ativas"
          value={loadingStats ? "—" : String(stats?.totalActive ?? 0)}
          sub={`Pipeline: ${formatCurrency(stats?.pipelineValue ?? 0)}`}
          color="blue"
        />
        <KpiCard
          icon={<Trophy className="w-5 h-5 text-emerald-500" />}
          label="Taxa de Conversão"
          value={loadingStats ? "—" : `${taxaConversao}%`}
          sub={`${ganhou} ganhas · ${perdeu} perdidas`}
          color="emerald"
        />
        <KpiCard
          icon={<DollarSign className="w-5 h-5 text-purple-500" />}
          label="Pipeline Orçamentos"
          value={loadingOrc ? "—" : formatCurrency(pipelineTotal)}
          sub={`${orcamentos?.total ?? 0} orçamentos`}
          color="purple"
        />
        <KpiCard
          icon={<AlertCircle className="w-5 h-5 text-orange-500" />}
          label="Docs Atenção"
          value={String((docStats?.expiring ?? 0) + (docStats?.expired ?? 0))}
          sub={`${docStats?.expired ?? 0} vencidos · ${docStats?.expiring ?? 0} a vencer`}
          color="orange"
        />
      </div>

      {/* Trend + Pie row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly trend chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="font-heading font-semibold text-foreground">Evolução Mensal</h2>
            </div>
          </div>
          {loadingTrend ? (
            <div className="h-52 bg-muted rounded animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={trend ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradIdent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradGanhas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="identificadas" name="Identificadas" stroke="#3b82f6" fill="url(#gradIdent)" strokeWidth={2} dot={{ r: 3 }} />
                <Area type="monotone" dataKey="ganhas" name="Ganhas" stroke="#10b981" fill="url(#gradGanhas)" strokeWidth={2} dot={{ r: 3 }} />
                <Area type="monotone" dataKey="perdidas" name="Perdidas" stroke="#f87171" fill="none" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status pie */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="font-heading font-semibold text-foreground">Por Status</h2>
          </div>
          {loadingStats || pieData.length === 0 ? (
            <div className="h-52 bg-muted rounded animate-pulse" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status] ?? PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {pieData.slice(0, 5).map((entry, i) => (
                  <div key={entry.status} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: STATUS_COLORS[entry.status] ?? PIE_COLORS[i] }}
                      />
                      <span className="text-muted-foreground">{entry.name}</span>
                    </div>
                    <span className="font-medium text-foreground">{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top Orçamentos bar chart */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <DollarSign className="w-5 h-5 text-primary" />
          <h2 className="font-heading font-semibold text-foreground">Maiores Orçamentos (com BDI)</h2>
        </div>
        {loadingOrc ? (
          <div className="h-52 bg-muted rounded animate-pulse" />
        ) : topOrc.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-10">Nenhum orçamento cadastrado</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topOrc} margin={{ top: 4, right: 4, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `R$${(v / 1e6).toFixed(1)}M`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
                      <p className="font-semibold text-foreground mb-1">{label}</p>
                      <p className="text-muted-foreground">
                        Valor: <span className="font-medium text-foreground">{formatCurrency(payload[0].value as number)}</span>
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="valor" name="Valor com BDI" radius={[4, 4, 0, 0]}>
                {topOrc.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom row: Prazos + Indicadores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prazos próximos */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="font-heading font-semibold text-foreground">Prazos Próximos</h2>
          </div>
          <UpcomingDeadlines />
        </div>

        {/* Indicadores */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <h2 className="font-heading font-semibold text-foreground">Indicadores de Desempenho</h2>
          </div>
          <div className="space-y-4">
            <Indicador
              label="Taxa de Conversão"
              value={Number(taxaConversao)}
              max={100}
              color="emerald"
              suffix="%"
              description={`${ganhou} ganhas de ${ganhou + perdeu} disputadas`}
            />
            <Indicador
              label="Documentação em Dia"
              value={
                (docStats?.total ?? 0) > 0
                  ? Math.round(((docStats?.valid ?? 0) / (docStats?.total ?? 1)) * 100)
                  : 0
              }
              max={100}
              color={(docStats?.expired ?? 0) > 0 ? "orange" : "emerald"}
              suffix="%"
              description={`${docStats?.valid ?? 0} de ${docStats?.total ?? 0} documentos válidos`}
            />
            <Indicador
              label="Orçamentos Aprovados"
              value={
                (orcamentos?.total ?? 0) > 0
                  ? Math.round(
                      ((orcamentos?.items.filter((o) => o.status === "APPROVED").length ?? 0) /
                        (orcamentos?.total ?? 1)) * 100
                    )
                  : 0
              }
              max={100}
              color="blue"
              suffix="%"
              description={`${orcamentos?.items.filter((o) => o.status === "APPROVED").length ?? 0} de ${orcamentos?.total ?? 0} orçamentos`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────────── */

function KpiCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: "blue" | "emerald" | "purple" | "orange";
}) {
  const bg = { blue: "bg-blue-50 dark:bg-blue-950/30", emerald: "bg-emerald-50 dark:bg-emerald-950/30", purple: "bg-purple-50 dark:bg-purple-950/30", orange: "bg-orange-50 dark:bg-orange-950/30" }[color];
  return (
    <div className={`rounded-xl p-5 ${bg} border border-border`}>
      <div className="flex items-center gap-2 mb-3">{icon}<span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span></div>
      <p className="text-2xl font-heading font-bold text-foreground truncate">{value}</p>
      <p className="text-xs text-muted-foreground mt-1 truncate">{sub}</p>
    </div>
  );
}

function UpcomingDeadlines() {
  const { data, isLoading } = trpc.licitacao.getUpcomingDeadlines.useQuery();
  if (isLoading) return <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>;
  if (!data?.length) return <p className="text-center text-muted-foreground text-sm py-6">Nenhum prazo nos próximos 30 dias</p>;
  return (
    <div className="divide-y divide-border">
      {data.map((l) => {
        const days = l.closingDate ? Math.ceil((new Date(l.closingDate).getTime() - Date.now()) / 86400000) : null;
        const urgent = days !== null && days <= 7;
        return (
          <div key={l.id} className="flex items-center gap-3 py-3">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${urgent ? "bg-red-500" : "bg-yellow-500"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{l.object}</p>
              <p className="text-xs text-muted-foreground">{l.number}</p>
            </div>
            {days !== null && (
              <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${urgent ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400"}`}>
                {days <= 0 ? "Encerrado" : `${days}d`}
              </span>
            )}
            <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          </div>
        );
      })}
    </div>
  );
}

function Indicador({
  label, value, max, color, suffix, description,
}: {
  label: string; value: number; max: number; color: "emerald" | "orange" | "blue"; suffix: string; description: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const barColor = { emerald: "bg-emerald-500", orange: "bg-orange-500", blue: "bg-blue-500" }[color];
  const textColor = { emerald: "text-emerald-600 dark:text-emerald-400", orange: "text-orange-600 dark:text-orange-400", blue: "text-blue-600 dark:text-blue-400" }[color];
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className={`text-sm font-bold ${textColor}`}>{value}{suffix}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
