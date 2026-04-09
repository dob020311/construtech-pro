"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import {
  Ruler,
  Calculator,
  CheckCircle2,
  Clock,
  TrendingUp,
  Edit2,
  Save,
  ArrowLeft,
  X,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { MedicaoStatus } from "@prisma/client";

const STATUS_LABELS: Record<MedicaoStatus, string> = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em Andamento",
  SUBMITTED: "Submetida",
  APPROVED: "Aprovada",
  PAID: "Paga",
};

const STATUS_COLORS: Record<MedicaoStatus, string> = {
  PENDING: "bg-slate-100 text-slate-600 border-slate-200",
  IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-200",
  SUBMITTED: "bg-amber-100 text-amber-700 border-amber-200",
  APPROVED: "bg-green-100 text-green-700 border-green-200",
  PAID: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

// Next status transitions
const STATUS_TRANSITIONS: Partial<Record<MedicaoStatus, { label: string; next: MedicaoStatus; color: string }>> = {
  PENDING: { label: "Iniciar Medição", next: "IN_PROGRESS", color: "bg-blue-600 hover:bg-blue-700 text-white" },
  IN_PROGRESS: { label: "Submeter para Aprovação", next: "SUBMITTED", color: "bg-amber-600 hover:bg-amber-700 text-white" },
  SUBMITTED: { label: "Aprovar Medição", next: "APPROVED", color: "bg-green-600 hover:bg-green-700 text-white" },
  APPROVED: { label: "Marcar como Paga", next: "PAID", color: "bg-emerald-600 hover:bg-emerald-700 text-white" },
};

interface EditingItem {
  id: string;
  quantityMeasured: number;
  notes: string;
}

export function MedicaoDetalhe({ id }: { id: string }) {
  const router = useRouter();
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);

  const { data: medicao, isLoading, error } = trpc.medicao.getById.useQuery({ id });
  const utils = trpc.useUtils();

  const updateItem = trpc.medicao.updateItem.useMutation({
    onSuccess: () => {
      utils.medicao.getById.invalidate({ id });
      toast.success("Item atualizado com sucesso!");
      setEditingItem(null);
    },
    onError: (err) => toast.error(err.message || "Erro ao atualizar item"),
  });

  const updateStatus = trpc.medicao.updateStatus.useMutation({
    onSuccess: () => {
      utils.medicao.getById.invalidate({ id });
      toast.success("Status atualizado com sucesso!");
    },
    onError: (err) => toast.error(err.message || "Erro ao atualizar status"),
  });

  const deleteMedicao = trpc.medicao.delete.useMutation({
    onSuccess: () => {
      toast.success("Medição excluída!");
      router.push("/medicao");
    },
    onError: (err) => toast.error(err.message || "Erro ao excluir medição"),
  });

  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-1/4" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 h-24" />
          ))}
        </div>
        <div className="bg-card border border-border rounded-xl h-64" />
      </div>
    );
  }

  if (error || !medicao) {
    return (
      <div className="bg-card border border-border rounded-xl py-20 text-center text-muted-foreground">
        <Ruler className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium text-foreground">Medição não encontrada</p>
        <button
          onClick={() => router.push("/medicao")}
          className="mt-4 text-sm text-primary hover:underline"
        >
          Voltar para Medições
        </button>
      </div>
    );
  }

  // Calculate summary values
  const totalBudgeted = medicao.items.reduce(
    (sum, item) => sum + Number(item.quantityBudget) * Number(item.unitPrice),
    0
  );
  const totalMeasured = medicao.items.reduce(
    (sum, item) => sum + Number(item.quantityMeasured) * Number(item.unitPrice),
    0
  );
  const percentExecuted = totalBudgeted > 0 ? (totalMeasured / totalBudgeted) * 100 : 0;

  const transition = STATUS_TRANSITIONS[medicao.status];

  function startEdit(item: { id: string; quantityMeasured: unknown; notes: string | null }) {
    setEditingItem({
      id: item.id,
      quantityMeasured: Number(item.quantityMeasured),
      notes: item.notes ?? "",
    });
  }

  function saveEdit() {
    if (!editingItem) return;
    updateItem.mutate({
      id: editingItem.id,
      quantityMeasured: editingItem.quantityMeasured,
      notes: editingItem.notes || undefined,
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <button
            onClick={() => router.push("/medicao")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Medições
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-muted-foreground font-medium">
              Medição #{medicao.number}
            </span>
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                STATUS_COLORS[medicao.status]
              )}
            >
              {STATUS_LABELS[medicao.status]}
            </span>
          </div>
          <h1 className="text-2xl font-heading font-bold mt-1">{medicao.name}</h1>
          <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDate(medicao.startDate)} — {formatDate(medicao.endDate)}
            </span>
            {medicao.orcamento && (
              <span className="truncate max-w-xs">{medicao.orcamento.name}</span>
            )}
          </div>
          {medicao.description && (
            <p className="text-sm text-muted-foreground mt-2">{medicao.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {transition && (
            <button
              onClick={() => updateStatus.mutate({ id: medicao.id, status: transition.next })}
              disabled={updateStatus.isPending}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50",
                transition.color
              )}
            >
              {updateStatus.isPending ? "Atualizando..." : transition.label}
            </button>
          )}
          <button
            onClick={() => {
              if (confirm("Tem certeza que deseja excluir esta medição?")) {
                deleteMedicao.mutate({ id: medicao.id });
              }
            }}
            disabled={deleteMedicao.isPending}
            className="px-4 py-2 border border-destructive text-destructive rounded-lg text-sm font-medium hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            Excluir
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calculator className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Valor Orçado</span>
          </div>
          <p className="text-xl font-heading font-bold">{formatCurrency(totalBudgeted)}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Ruler className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Valor Medido</span>
          </div>
          <p className="text-xl font-heading font-bold text-emerald-600">
            {formatCurrency(totalMeasured)}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">% Executado</span>
          </div>
          <p className="text-xl font-heading font-bold text-primary">
            {percentExecuted.toFixed(1)}%
          </p>
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min(percentExecuted, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-heading font-semibold text-sm">Itens da Medição</h2>
          </div>
          <span className="text-xs text-muted-foreground">{medicao.items.length} iten(s)</span>
        </div>

        {medicao.items.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-sm">Nenhum item nesta medição</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descrição</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground w-16">Und</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground w-28">Qtd Orçada</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground w-28">Qtd Medida</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground w-28">Preço Unit.</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground w-32">Valor Medido</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground w-16">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {medicao.items.map((item) => {
                  const isEditing = editingItem?.id === item.id;
                  const measuredValue =
                    Number(isEditing ? editingItem.quantityMeasured : item.quantityMeasured) *
                    Number(item.unitPrice);

                  return (
                    <tr key={item.id} className={cn("hover:bg-muted/20 transition-colors", isEditing && "bg-primary/5")}>
                      <td className="px-4 py-3">
                        <p className="font-medium leading-tight">{item.description}</p>
                        {(isEditing ? editingItem.notes : item.notes) && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {isEditing ? editingItem.notes : item.notes}
                          </p>
                        )}
                        {isEditing && (
                          <input
                            type="text"
                            placeholder="Observação..."
                            value={editingItem.notes}
                            onChange={(e) =>
                              setEditingItem((prev) => prev ? { ...prev, notes: e.target.value } : null)
                            }
                            className="mt-1.5 w-full px-2 py-1 text-xs bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary/40"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{item.unit}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {Number(item.quantityBudget).toLocaleString("pt-BR", { maximumFractionDigits: 4 })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            step="0.0001"
                            value={editingItem.quantityMeasured}
                            onChange={(e) =>
                              setEditingItem((prev) =>
                                prev ? { ...prev, quantityMeasured: parseFloat(e.target.value) || 0 } : null
                              )
                            }
                            className="w-28 px-2 py-1 text-right bg-background border border-primary rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
                            autoFocus
                          />
                        ) : (
                          <span className={cn(
                            "tabular-nums font-medium",
                            Number(item.quantityMeasured) > 0 ? "text-emerald-600" : "text-muted-foreground"
                          )}>
                            {Number(item.quantityMeasured).toLocaleString("pt-BR", { maximumFractionDigits: 4 })}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {formatCurrency(Number(item.unitPrice))}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold">
                        {formatCurrency(measuredValue)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={saveEdit}
                              disabled={updateItem.isPending}
                              className="p-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                              title="Salvar"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingItem(null)}
                              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                              title="Cancelar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(item)}
                            disabled={medicao.status === "APPROVED" || medicao.status === "PAID"}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Editar quantidade"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30 border-t-2 border-border font-semibold">
                  <td colSpan={5} className="px-4 py-3 text-right text-sm">
                    Total Medido:
                  </td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums text-emerald-600">
                    {formatCurrency(totalMeasured)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Status Update Buttons */}
      {transition && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-heading font-semibold text-sm mb-3">Atualizar Status</h3>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Status atual:{" "}
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                  STATUS_COLORS[medicao.status]
                )}
              >
                {STATUS_LABELS[medicao.status]}
              </span>
            </p>
            <button
              onClick={() => updateStatus.mutate({ id: medicao.id, status: transition.next })}
              disabled={updateStatus.isPending}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50",
                transition.color
              )}
            >
              <CheckCircle2 className="w-4 h-4" />
              {updateStatus.isPending ? "Atualizando..." : transition.label}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
