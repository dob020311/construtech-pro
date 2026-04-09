"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  Plus,
  ShoppingCart,
  X,
  ChevronDown,
  Package,
  Calendar,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { CompraStatus } from "@prisma/client";

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<CompraStatus, string> = {
  DRAFT: "Rascunho",
  QUOTING: "Em Cotação",
  APPROVED: "Aprovada",
  ORDERED: "Pedido Enviado",
  PARTIALLY_DELIVERED: "Entrega Parcial",
  DELIVERED: "Entregue",
  CANCELED: "Cancelada",
};

const STATUS_COLORS: Record<CompraStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
  QUOTING: "bg-amber-100 text-amber-700 border-amber-200",
  APPROVED: "bg-green-100 text-green-700 border-green-200",
  ORDERED: "bg-blue-100 text-blue-700 border-blue-200",
  PARTIALLY_DELIVERED: "bg-orange-100 text-orange-700 border-orange-200",
  DELIVERED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CANCELED: "bg-gray-100 text-gray-600 border-gray-200",
};

// ─── Nova Compra Modal ─────────────────────────────────────────────────────────

function NovaCompraModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [orcamentoId, setOrcamentoId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const utils = trpc.useUtils();
  const { data: orcamentosData } = trpc.orcamento.list.useQuery({
    page: 1,
    limit: 100,
  });

  const create = trpc.compras.create.useMutation({
    onSuccess: () => {
      utils.compras.list.invalidate();
      toast.success("Compra criada com sucesso");
      onClose();
    },
    onError: (err) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Informe o nome da compra"); return; }
    create.mutate({
      name: name.trim(),
      orcamentoId: orcamentoId || undefined,
      deadline: deadline ? new Date(deadline) : undefined,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-heading font-bold">Nova Compra</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Nome da Compra *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Aquisição de Cimento — Etapa 1"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Orçamento Vinculado (opcional)
            </label>
            <div className="relative">
              <select
                value={orcamentoId}
                onChange={(e) => setOrcamentoId(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none pr-8"
              >
                <option value="">Nenhum</option>
                {orcamentosData?.items.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Prazo (opcional)
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Observações
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Observações adicionais..."
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {create.isPending ? "Criando..." : "Criar Compra"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function ComprasContent() {
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<CompraStatus | "">("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.compras.list.useQuery({
    status: statusFilter || undefined,
    page,
    limit: 20,
  });

  const utils = trpc.useUtils();
  const deleteCompra = trpc.compras.delete.useMutation({
    onSuccess: () => {
      utils.compras.list.invalidate();
      toast.success("Compra removida");
    },
    onError: (err) => toast.error(err.message),
  });

  const statusOptions: Array<{ value: CompraStatus | ""; label: string }> = [
    { value: "", label: "Todos os status" },
    ...Object.entries(STATUS_LABELS).map(([value, label]) => ({
      value: value as CompraStatus,
      label,
    })),
  ];

  return (
    <div className="space-y-5">
      {showModal && <NovaCompraModal onClose={() => setShowModal(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Compras</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {data?.total ?? 0} compras cadastradas
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nova Compra
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          Filtrar por status:
        </label>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as CompraStatus | "");
              setPage(1);
            }}
            className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none pr-7"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-5 animate-pulse"
            >
              <div className="h-4 w-3/4 bg-muted rounded mb-3" />
              <div className="h-3 w-1/2 bg-muted rounded mb-4" />
              <div className="h-5 w-24 bg-muted rounded-full mb-4" />
              <div className="h-6 w-40 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-20 text-center text-muted-foreground">
          <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-foreground">Nenhuma compra cadastrada</p>
          <p className="text-sm mt-1">
            Crie sua primeira compra clicando em "Nova Compra"
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data?.items.map((compra) => {
              const selectedCotacao = compra.cotacoes[0];
              return (
                <Link
                  key={compra.id}
                  href={`/compras/${compra.id}`}
                  className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all group flex flex-col"
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xs text-muted-foreground font-mono">
                      #{String(compra.number).padStart(3, "0")}
                    </span>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full border font-medium",
                        STATUS_COLORS[compra.status]
                      )}
                    >
                      {STATUS_LABELS[compra.status]}
                    </span>
                  </div>

                  <h3 className="font-heading font-semibold text-sm leading-tight line-clamp-2 mb-3">
                    {compra.name}
                  </h3>

                  <div className="flex flex-col gap-1.5 text-xs text-muted-foreground flex-1">
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{compra._count.items} iten{compra._count.items !== 1 ? "s" : ""}</span>
                    </div>
                    {compra.deadline && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Prazo: {formatDate(compra.deadline)}</span>
                      </div>
                    )}
                    {compra.orcamento && (
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{compra.orcamento.name}</span>
                      </div>
                    )}
                  </div>

                  {selectedCotacao && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Melhor cotação
                      </p>
                      <p className="text-base font-heading font-bold text-primary">
                        {formatCurrency(Number(selectedCotacao.totalValue))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedCotacao.supplier}
                      </p>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {data && data.pages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} de{" "}
                {data.total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-sm hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                {Array.from({ length: data.pages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={cn(
                        "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                        page === p
                          ? "bg-primary text-white"
                          : "hover:bg-muted"
                      )}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === data.pages}
                  className="px-3 py-1.5 rounded-lg text-sm hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
