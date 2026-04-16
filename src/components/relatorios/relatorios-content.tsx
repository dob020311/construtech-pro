"use client";

import { useState } from "react";
import { trpc as api } from "@/lib/trpc";
import {
  FileText,
  Download,
  Sparkles,
  Calculator,
  ClipboardList,
  BarChart3,
  Loader2,
  ChevronDown,
  Building2,
  CalendarDays,
  ShoppingCart,
  Trophy,
  Ruler,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

const STATUS_LABELS: Record<string, string> = {
  // OrcamentoStatus
  DRAFT: "Rascunho",
  IN_PROGRESS: "Em Andamento",
  REVIEW: "Em Revisão",
  APPROVED: "Aprovado",
  SUBMITTED: "Submetido",
  // MedicaoStatus
  PENDING: "Pendente",
  PAID: "Pago",
  // CompraStatus
  QUOTING: "Cotando",
  ORDERED: "Pedido Efetuado",
  PARTIALLY_DELIVERED: "Parcial Entregue",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
};

function label(s: string) {
  return STATUS_LABELS[s] ?? s;
}

// ─── Dashboard Tab ──────────────────────────────────────────────────────────

function DashboardTab() {
  const [selectedOrcId, setSelectedOrcId] = useState("");

  const { data: resumo, isLoading: loadingResumo } =
    api.relatorios.resumoGeral.useQuery();
  const { data: orcamentos } = api.orcamento.list.useQuery({ limit: 100 });
  const { data: resumoOrc, isLoading: loadingOrc } =
    api.relatorios.resumoOrcamento.useQuery(
      { orcamentoId: selectedOrcId },
      { enabled: !!selectedOrcId }
    );

  // Compute max counts for bar scaling
  const maxOrc = Math.max(
    1,
    ...(resumo?.orcamentosPorStatus.map((s) => s.count) ?? [1])
  );
  const maxMed = Math.max(
    1,
    ...(resumo?.medicoesPorStatus.map((s) => s.count) ?? [1])
  );
  const maxCom = Math.max(
    1,
    ...(resumo?.comprasPorStatus.map((s) => s.count) ?? [1])
  );

  return (
    <div className="space-y-6">
      {/* ── Seção 1 – KPI cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Valor Total Orçado */}
        <div className="rounded-xl border border-border bg-card p-5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Valor Total Orçado</p>
            {loadingResumo ? (
              <div className="h-5 w-28 bg-muted rounded mt-1 animate-pulse" />
            ) : (
              <p className="text-lg font-bold text-foreground truncate">
                {fmt(resumo?.valorTotalOrcado ?? 0)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              {resumo?.totalOrcamentos ?? 0} orçamentos
            </p>
          </div>
        </div>

        {/* Valor Total Medido */}
        <div className="rounded-xl border border-border bg-card p-5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <Ruler className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Valor Total Medido</p>
            {loadingResumo ? (
              <div className="h-5 w-28 bg-muted rounded mt-1 animate-pulse" />
            ) : (
              <p className="text-lg font-bold text-foreground truncate">
                {fmt(resumo?.valorTotalMedido ?? 0)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              {resumo?.totalMedicoes ?? 0} medições
            </p>
          </div>
        </div>

        {/* Total em Compras */}
        <div className="rounded-xl border border-border bg-card p-5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-5 h-5 text-amber-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Total em Compras</p>
            {loadingResumo ? (
              <div className="h-5 w-28 bg-muted rounded mt-1 animate-pulse" />
            ) : (
              <p className="text-lg font-bold text-foreground truncate">
                {fmt(resumo?.valorTotalCompras ?? 0)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              {resumo?.totalCompras ?? 0} compras
            </p>
          </div>
        </div>

        {/* Licitações Ganhas */}
        <div className="rounded-xl border border-border bg-card p-5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-5 h-5 text-violet-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Licitações Ganhas</p>
            {loadingResumo ? (
              <div className="h-5 w-16 bg-muted rounded mt-1 animate-pulse" />
            ) : (
              <p className="text-lg font-bold text-foreground">
                {resumo?.licitacoesGanhas ?? 0}
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  / {resumo?.totalLicitacoes ?? 0}
                </span>
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">licitações totais</p>
          </div>
        </div>
      </div>

      {/* ── Seção 2 – Gráficos por status (CSS apenas) ───────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Orçamentos por status */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground mb-3">Orçamentos por Status</p>
          {loadingResumo ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : resumo?.orcamentosPorStatus.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum orçamento</p>
          ) : (
            <div className="space-y-2">
              {resumo?.orcamentosPorStatus.map((s) => {
                const pct = Math.round((s.count / maxOrc) * 100);
                return (
                  <div key={s.status} className="flex items-center gap-2 mb-1">
                    <span className="w-32 text-xs truncate">{label(s.status)}</span>
                    <div className="flex-1 bg-muted rounded h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-6 text-right">
                      {s.count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Medições por status */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground mb-3">Medições por Status</p>
          {loadingResumo ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : resumo?.medicoesPorStatus.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma medição</p>
          ) : (
            <div className="space-y-2">
              {resumo?.medicoesPorStatus.map((s) => {
                const pct = Math.round((s.count / maxMed) * 100);
                return (
                  <div key={s.status} className="flex items-center gap-2 mb-1">
                    <span className="w-32 text-xs truncate">{label(s.status)}</span>
                    <div className="flex-1 bg-muted rounded h-2.5">
                      <div
                        className="bg-emerald-500 h-2.5 rounded transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-6 text-right">
                      {s.count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Compras por status */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground mb-3">Compras por Status</p>
          {loadingResumo ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : resumo?.comprasPorStatus.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma compra</p>
          ) : (
            <div className="space-y-2">
              {resumo?.comprasPorStatus.map((s) => {
                const pct = Math.round((s.count / maxCom) * 100);
                return (
                  <div key={s.status} className="flex items-center gap-2 mb-1">
                    <span className="w-32 text-xs truncate">{label(s.status)}</span>
                    <div className="flex-1 bg-muted rounded h-2.5">
                      <div
                        className="bg-amber-500 h-2.5 rounded transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-6 text-right">
                      {s.count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Seção 3 – Relatório por Orçamento ────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <p className="text-sm font-semibold text-foreground">Relatório por Orçamento</p>

        {/* Selector */}
        <div className="relative max-w-xs">
          <select
            value={selectedOrcId}
            onChange={(e) => setSelectedOrcId(e.target.value)}
            className="w-full appearance-none bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary pr-8"
          >
            <option value="">Selecione um orçamento…</option>
            {orcamentos?.items.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
                {o.licitacao ? ` — ${o.licitacao.organ}` : ""}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>

        {/* Loading */}
        {loadingOrc && selectedOrcId && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando…
          </div>
        )}

        {/* Content */}
        {resumoOrc && !loadingOrc && (
          <div className="space-y-4">
            {/* Cabeçalho */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="font-medium text-foreground">{resumoOrc.orcamento.name}</span>
              <span className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
                {label(resumoOrc.orcamento.status)}
              </span>
              <span className="text-muted-foreground text-xs">
                BDI {resumoOrc.orcamento.bdiPercentage.toFixed(2)}%
              </span>
            </div>

            {/* Tabela de etapas */}
            {resumoOrc.chapters.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Etapa</th>
                      <th className="text-right py-2 px-2 text-muted-foreground font-medium">Orçado (R$)</th>
                      <th className="text-right py-2 px-2 text-muted-foreground font-medium">Medido (R$)</th>
                      <th className="text-right py-2 pl-2 text-muted-foreground font-medium">% Executado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumoOrc.chapters.map((ch, idx) => (
                      <tr key={idx} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2 pr-4 text-foreground font-medium truncate max-w-[200px]">
                          {ch.name}
                        </td>
                        <td className="py-2 px-2 text-right text-foreground">
                          {fmt(ch.valorOrcado)}
                        </td>
                        <td className="py-2 px-2 text-right text-emerald-500">
                          {fmt(ch.valorMedido)}
                        </td>
                        <td className="py-2 pl-2 text-right">
                          <span
                            className={
                              ch.percentExecutado >= 100
                                ? "text-emerald-500 font-semibold"
                                : ch.percentExecutado >= 50
                                ? "text-amber-500"
                                : "text-muted-foreground"
                            }
                          >
                            {ch.percentExecutado.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Nenhuma etapa cadastrada.</p>
            )}

            {/* Barra de progresso geral */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progresso Geral</span>
                <span>{resumoOrc.percentualGeral.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-muted rounded h-3">
                <div
                  className="bg-primary h-3 rounded transition-all"
                  style={{
                    width: `${Math.min(resumoOrc.percentualGeral, 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-muted-foreground">
                  Medido: <span className="text-foreground font-medium">{fmt(resumoOrc.totalMedido)}</span>
                </span>
                <span className="text-muted-foreground">
                  Orçado: <span className="text-foreground font-medium">{fmt(resumoOrc.totalOrcado)}</span>
                </span>
              </div>
            </div>

            {/* Compras vinculadas */}
            {resumoOrc.comprasVinculadas.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Compras Vinculadas
                </p>
                <div className="space-y-1">
                  {resumoOrc.comprasVinculadas.map((c, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-muted/40"
                    >
                      <span className="text-muted-foreground w-8">#{c.number}</span>
                      <span className="flex-1 text-foreground truncate px-2">{c.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                        {label(c.status)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!selectedOrcId && (
          <p className="text-xs text-muted-foreground">
            Selecione um orçamento para ver o relatório detalhado.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── AI Report Generator Tab (original content) ─────────────────────────────

type ReportType = {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  needsOrcamento: boolean;
};

const REPORT_TYPES: ReportType[] = [
  {
    id: "proposta_tecnica",
    label: "Proposta Técnica",
    description: "Apresentação, qualificação e escopo técnico com narrativa gerada por IA",
    icon: FileText,
    color: "text-blue-400",
    needsOrcamento: true,
  },
  {
    id: "planilha_orcamentaria",
    label: "Planilha Orçamentária",
    description: "Planilha completa com capítulos, itens, BDI e Curva ABC em PDF",
    icon: Calculator,
    color: "text-emerald-400",
    needsOrcamento: true,
  },
  {
    id: "memoria_calculo",
    label: "Memória de Cálculo",
    description: "Metodologia de composição de preços e critérios de BDI",
    icon: ClipboardList,
    color: "text-violet-400",
    needsOrcamento: true,
  },
  {
    id: "relatorio_medicao",
    label: "Relatório de Medição",
    description: "Consolidado de medições aprovadas por período",
    icon: BarChart3,
    color: "text-amber-400",
    needsOrcamento: false,
  },
  {
    id: "cronograma",
    label: "Cronograma Físico-Financeiro",
    description: "Planilha de avanço físico e desembolso financeiro por período",
    icon: CalendarDays,
    color: "text-cyan-400",
    needsOrcamento: true,
  },
];

interface ReportData {
  titulo: string;
  narrativa: string;
  empresa: { name: string; cnpj?: string; email?: string; phone?: string; address?: string } | null;
  orcamento: {
    id: string;
    name: string;
    bdiPercentage: number;
    totalValue: number;
    totalWithBdi: number;
    licitacao: { number: string; object: string; organ: string } | null;
    chapters: {
      code: string;
      name: string;
      items: {
        code: string;
        description: string;
        unit: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        source: string | null;
      }[];
    }[];
  } | null;
}

function GerarRelatorioTab() {
  const [selectedType, setSelectedType] = useState<string>("proposta_tecnica");
  const [selectedOrcamentoId, setSelectedOrcamentoId] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const { data: orcamentos } = api.orcamento.list.useQuery({ limit: 50 });

  const selectedReportType = REPORT_TYPES.find((r) => r.id === selectedType)!;

  const handleGenerate = async () => {
    if (selectedReportType.needsOrcamento && !selectedOrcamentoId) {
      toast.error("Selecione um orçamento");
      return;
    }
    setIsGenerating(true);
    setReportData(null);
    try {
      const res = await fetch("/api/relatorios/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: selectedType,
          orcamentoId: selectedOrcamentoId || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao gerar relatório");
      }
      const data = await res.json();
      setReportData(data);
      toast.success("Relatório gerado com sucesso");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar relatório");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportData) return;
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 18;
    let y = margin;

    // Header bar
    doc.setFillColor(15, 52, 96);
    doc.rect(0, 0, pageW, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("ConstruTech Pro", margin, 12);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(reportData.empresa?.name || "", margin, 19);
    doc.setFontSize(10);
    doc.text(reportData.titulo, pageW - margin, 17, { align: "right" });

    y = 36;

    // Title
    doc.setTextColor(15, 52, 96);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(reportData.titulo, margin, y);
    y += 6;

    if (reportData.orcamento?.licitacao) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      const lic = reportData.orcamento.licitacao;
      doc.text(`Licitação ${lic.number} — ${lic.organ}`, margin, y);
      y += 4;
      doc.text(lic.object, margin, y, { maxWidth: pageW - margin * 2 });
      y += 6;
    }

    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageW - margin, y);
    y += 6;

    if (reportData.narrativa) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 52, 96);
      doc.text("Apresentação", margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      const lines = doc.splitTextToSize(reportData.narrativa, pageW - margin * 2);
      doc.text(lines, margin, y);
      y += (lines as string[]).length * 5 + 6;
    }

    if (reportData.orcamento && reportData.orcamento.chapters.length > 0) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 52, 96);
      doc.text("Planilha Orçamentária", margin, y);
      y += 4;

      type TableRow = (string | { content: string; colSpan?: number; styles?: Record<string, unknown> })[];
      const rows: TableRow[] = [];

      for (const ch of reportData.orcamento.chapters) {
        const chTotal = ch.items.reduce((s, i) => s + i.totalPrice, 0);
        rows.push([
          { content: `${ch.code} — ${ch.name}`, colSpan: 6, styles: { fillColor: [230, 237, 255], fontStyle: "bold", textColor: [15, 52, 96] } },
        ]);
        for (const it of ch.items) {
          rows.push([
            it.code,
            it.description,
            it.unit,
            it.quantity.toLocaleString("pt-BR", { maximumFractionDigits: 2 }),
            `R$ ${it.unitPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            `R$ ${it.totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          ]);
        }
        rows.push([
          { content: `Subtotal ${ch.code}`, colSpan: 5, styles: { fontStyle: "bold", halign: "right" } },
          { content: `R$ ${chTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, styles: { fontStyle: "bold" } },
        ]);
      }

      autoTable(doc, {
        startY: y,
        head: [["Código", "Descrição", "Unid.", "Quant.", "P.Unit.", "Total"]],
        body: rows as Parameters<typeof autoTable>[1]["body"],
        margin: { left: margin, right: margin },
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: [15, 52, 96], textColor: 255, fontStyle: "bold" },
        columnStyles: {
          0: { cellWidth: 18 },
          1: { cellWidth: "auto" },
          2: { cellWidth: 12, halign: "center" },
          3: { cellWidth: 16, halign: "right" },
          4: { cellWidth: 22, halign: "right" },
          5: { cellWidth: 26, halign: "right" },
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable.finalY + 6;

      doc.setFillColor(240, 244, 255);
      doc.roundedRect(pageW - margin - 75, y, 75, 22, 2, 2, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      doc.text("Custo Direto:", pageW - margin - 70, y + 6);
      doc.text(
        `R$ ${reportData.orcamento.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        pageW - margin - 3, y + 6, { align: "right" }
      );
      doc.text(`BDI (${reportData.orcamento.bdiPercentage}%):`, pageW - margin - 70, y + 12);
      const bdiValue = reportData.orcamento.totalWithBdi - reportData.orcamento.totalValue;
      doc.text(
        `R$ ${bdiValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        pageW - margin - 3, y + 12, { align: "right" }
      );
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 52, 96);
      doc.text("Total com BDI:", pageW - margin - 70, y + 19);
      doc.text(
        `R$ ${reportData.orcamento.totalWithBdi.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        pageW - margin - 3, y + 19, { align: "right" }
      );
    }

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFillColor(240, 240, 240);
      doc.rect(0, 284, pageW, 13, "F");
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Gerado por ConstruTech Pro — ${new Date().toLocaleDateString("pt-BR")} — Lei 14.133/2021`,
        margin, 291
      );
      doc.text(`Página ${i} de ${totalPages}`, pageW - margin, 291, { align: "right" });
    }

    const fileName = `${reportData.titulo.replace(/[^a-zA-Z0-9À-ÿ\s]/g, "").replace(/\s+/g, "_")}.pdf`;
    doc.save(fileName);
    toast.success("PDF baixado com sucesso");
  };

  const getCurvaABC = () => {
    if (!reportData?.orcamento) return [];
    const items = reportData.orcamento.chapters.flatMap((c) =>
      c.items.map((i) => ({ ...i, chapter: c.name }))
    );
    const total = items.reduce((s, i) => s + i.totalPrice, 0);
    if (total === 0) return [];
    const sorted = [...items].sort((a, b) => b.totalPrice - a.totalPrice);
    let acc = 0;
    return sorted.map((i) => {
      acc += i.totalPrice;
      const pct = (i.totalPrice / total) * 100;
      const accPct = (acc / total) * 100;
      return { ...i, pct, accPct, classe: accPct <= 50 ? "A" : accPct <= 80 ? "B" : "C" };
    });
  };

  const curvaABC = reportData ? getCurvaABC() : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left panel */}
      <div className="lg:col-span-1 space-y-4">
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">Tipo de Relatório</p>
          <div className="space-y-2">
            {REPORT_TYPES.map((rt) => (
              <button
                key={rt.id}
                onClick={() => { setSelectedType(rt.id); setReportData(null); }}
                className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                  selectedType === rt.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/40"
                }`}
              >
                <rt.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${rt.color}`} />
                <div>
                  <p className={`text-sm font-medium ${selectedType === rt.id ? "text-primary" : "text-foreground"}`}>
                    {rt.label}
                  </p>
                  <p className="text-xs text-muted-foreground leading-snug mt-0.5">{rt.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedReportType.needsOrcamento && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <p className="text-sm font-semibold text-foreground">Orçamento</p>
            <div className="relative">
              <select
                value={selectedOrcamentoId}
                onChange={(e) => { setSelectedOrcamentoId(e.target.value); setReportData(null); }}
                className="w-full appearance-none bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary pr-8"
              >
                <option value="">Selecione um orçamento...</option>
                {orcamentos?.items.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} — {o.licitacao?.organ || "Sem licitação"}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Gerando com IA...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Gerar Relatório
            </>
          )}
        </button>
      </div>

      {/* Right panel — preview */}
      <div className="lg:col-span-2">
        {!reportData && !isGenerating && (
          <div className="rounded-xl border border-dashed border-border bg-card/50 h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <FileText className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Nenhum relatório gerado</p>
            <p className="text-xs text-muted-foreground mt-1">
              Selecione o tipo, o orçamento e clique em Gerar Relatório
            </p>
          </div>
        )}

        {isGenerating && (
          <div className="rounded-xl border border-border bg-card h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8">
            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-violet-400 animate-pulse" />
            </div>
            <p className="text-sm font-medium text-foreground">IA gerando narrativa...</p>
            <p className="text-xs text-muted-foreground mt-1">Analisando orçamento e redigindo o relatório</p>
          </div>
        )}

        {reportData && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="bg-[hsl(218,35%,10%)] px-4 py-2.5 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">{reportData.titulo}.pdf</span>
              </div>
              <button onClick={handleDownloadPDF} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                <Download className="w-3.5 h-3.5" />
                Baixar
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">{reportData.empresa?.name}</p>
                    {reportData.empresa?.cnpj && (
                      <p className="text-xs text-muted-foreground">CNPJ: {reportData.empresa.cnpj}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-primary">{reportData.titulo}</p>
                  <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString("pt-BR")}</p>
                </div>
              </div>

              {reportData.orcamento?.licitacao && (
                <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                  <p className="text-xs font-semibold text-foreground">
                    Licitação {reportData.orcamento.licitacao.number} — {reportData.orcamento.licitacao.organ}
                  </p>
                  <p className="text-xs text-muted-foreground">{reportData.orcamento.licitacao.object}</p>
                </div>
              )}

              {reportData.narrativa && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide">Apresentação</p>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                    {reportData.narrativa}
                  </p>
                </div>
              )}

              {reportData.orcamento && reportData.orcamento.chapters.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide">Resumo por Capítulo</p>
                  <div className="space-y-1">
                    {reportData.orcamento.chapters.map((ch) => {
                      const chTotal = ch.items.reduce((s, i) => s + i.totalPrice, 0);
                      const pct = reportData.orcamento!.totalValue > 0
                        ? (chTotal / reportData.orcamento!.totalValue) * 100 : 0;
                      return (
                        <div key={ch.code} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-8">{ch.code}</span>
                          <span className="text-xs text-foreground flex-1 truncate">{ch.name}</span>
                          <span className="text-xs text-muted-foreground w-10 text-right">{pct.toFixed(1)}%</span>
                          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-medium text-foreground w-28 text-right">
                            R$ {chTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {reportData.orcamento && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Custo Direto</span>
                    <span className="text-foreground">
                      R$ {reportData.orcamento.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">BDI ({reportData.orcamento.bdiPercentage}%)</span>
                    <span className="text-foreground">
                      R$ {(reportData.orcamento.totalWithBdi - reportData.orcamento.totalValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-1 border-t border-primary/20">
                    <span className="text-primary">Total com BDI</span>
                    <span className="text-primary">
                      R$ {reportData.orcamento.totalWithBdi.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {curvaABC.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide">Curva ABC — Top 10 Itens</p>
                  <div className="space-y-1">
                    {curvaABC.slice(0, 10).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className={`text-xs font-bold w-4 ${
                          item.classe === "A" ? "text-red-400" :
                          item.classe === "B" ? "text-amber-400" : "text-emerald-400"
                        }`}>{item.classe}</span>
                        <span className="text-xs text-muted-foreground flex-1 truncate">{item.description}</span>
                        <span className="text-xs text-foreground w-12 text-right">{item.pct.toFixed(1)}%</span>
                        <span className="text-xs font-medium text-foreground w-28 text-right">
                          R$ {item.totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Root export ─────────────────────────────────────────────────────────────

type Tab = "dashboard" | "gerar";

export function RelatoriosContent() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Dashboard analítico e geração de relatórios profissionais com IA
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "dashboard"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab("gerar")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "gerar"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Gerar Relatório
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "dashboard" ? <DashboardTab /> : <GerarRelatorioTab />}
    </div>
  );
}
