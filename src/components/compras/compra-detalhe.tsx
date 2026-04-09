"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  Plus,
  X,
  Trash2,
  CheckCircle2,
  ChevronDown,
  ShoppingCart,
  ArrowLeft,
  PackagePlus,
  MessageSquarePlus,
} from "lucide-react";
import { toast } from "sonner";
import { CompraStatus } from "@prisma/client";
import Link from "next/link";

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

const ABC_COLORS: Record<string, string> = {
  A: "bg-red-100 text-red-700 border-red-200",
  B: "bg-amber-100 text-amber-700 border-amber-200",
  C: "bg-green-100 text-green-700 border-green-200",
};

// ─── Add Item Form ─────────────────────────────────────────────────────────────

function AddItemForm({ compraId, onDone }: { compraId: string; onDone: () => void }) {
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("un");
  const [quantity, setQuantity] = useState("1");
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const utils = trpc.useUtils();
  const addItem = trpc.compras.addItem.useMutation({
    onSuccess: () => {
      utils.compras.getById.invalidate({ id: compraId });
      toast.success("Item adicionado");
      setDescription("");
      setUnit("un");
      setQuantity("1");
      setEstimatedPrice("");
      setCategory("");
      setNotes("");
      setOpen(false);
      onDone();
    },
    onError: (err) => setError(err.message),
  });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors border border-dashed border-primary/40 w-full justify-center"
      >
        <PackagePlus className="w-4 h-4" />
        Adicionar Item
      </button>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) { setError("Informe a descrição"); return; }
    if (!unit.trim()) { setError("Informe a unidade"); return; }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) { setError("Quantidade inválida"); return; }
    addItem.mutate({
      compraId,
      description: description.trim(),
      unit: unit.trim(),
      quantity: qty,
      estimatedPrice: estimatedPrice ? parseFloat(estimatedPrice) : undefined,
      category: category.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <div className="border border-primary/20 rounded-lg p-4 bg-primary/5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium">Novo Item</p>
        <button
          onClick={() => { setOpen(false); setError(""); }}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição do item *"
            className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            autoFocus
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Unidade *"
              className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Qtd *"
              min="0"
              step="0.01"
              className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <input
              type="number"
              value={estimatedPrice}
              onChange={(e) => setEstimatedPrice(e.target.value)}
              placeholder="Preço est."
              min="0"
              step="0.01"
              className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>
        <div>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Categoria (opcional)"
            className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setOpen(false); setError(""); }}
            className="flex-1 px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={addItem.isPending}
            className="flex-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {addItem.isPending ? "Adicionando..." : "Adicionar"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Add Cotação Form ──────────────────────────────────────────────────────────

function AddCotacaoForm({ compraId, onDone }: { compraId: string; onDone: () => void }) {
  const [supplier, setSupplier] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const utils = trpc.useUtils();
  const addCotacao = trpc.compras.addCotacao.useMutation({
    onSuccess: () => {
      utils.compras.getById.invalidate({ id: compraId });
      toast.success("Cotação adicionada");
      setSupplier("");
      setContactName("");
      setContactPhone("");
      setTotalValue("");
      setValidUntil("");
      setNotes("");
      setOpen(false);
      onDone();
    },
    onError: (err) => setError(err.message),
  });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors border border-dashed border-primary/40 w-full justify-center"
      >
        <MessageSquarePlus className="w-4 h-4" />
        Adicionar Cotação
      </button>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplier.trim()) { setError("Informe o fornecedor"); return; }
    const val = parseFloat(totalValue);
    if (isNaN(val) || val < 0) { setError("Valor inválido"); return; }
    addCotacao.mutate({
      compraId,
      supplier: supplier.trim(),
      contactName: contactName.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      totalValue: val,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <div className="border border-primary/20 rounded-lg p-4 bg-primary/5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium">Nova Cotação</p>
        <button
          onClick={() => { setOpen(false); setError(""); }}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          placeholder="Fornecedor *"
          className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          autoFocus
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Contato (nome)"
            className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <input
            type="text"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="Telefone"
            className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Valor Total (R$) *
            </label>
            <input
              type="number"
              value={totalValue}
              onChange={(e) => setTotalValue(e.target.value)}
              placeholder="0,00"
              min="0"
              step="0.01"
              className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Válido até
            </label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Observações..."
          className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setOpen(false); setError(""); }}
            className="flex-1 px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={addCotacao.isPending}
            className="flex-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {addCotacao.isPending ? "Adicionando..." : "Adicionar"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Status Change Button ──────────────────────────────────────────────────────

function StatusChangeButton({
  compraId,
  currentStatus,
}: {
  compraId: string;
  currentStatus: CompraStatus;
}) {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  const updateStatus = trpc.compras.updateStatus.useMutation({
    onSuccess: () => {
      utils.compras.getById.invalidate({ id: compraId });
      toast.success("Status atualizado");
      setOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const statusOptions = Object.entries(STATUS_LABELS).filter(
    ([value]) => value !== currentStatus
  ) as [CompraStatus, string][];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
      >
        Alterar Status
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-20 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[180px]">
            {statusOptions.map(([value, label]) => (
              <button
                key={value}
                onClick={() => updateStatus.mutate({ id: compraId, status: value })}
                disabled={updateStatus.isPending}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors disabled:opacity-50"
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function CompraDetalhe({ id }: { id: string }) {
  const { data: compra, isLoading } = trpc.compras.getById.useQuery({ id });
  const utils = trpc.useUtils();

  const removeItem = trpc.compras.removeItem.useMutation({
    onSuccess: () => {
      utils.compras.getById.invalidate({ id });
      toast.success("Item removido");
    },
    onError: (err) => toast.error(err.message),
  });

  const selectCotacao = trpc.compras.selectCotacao.useMutation({
    onSuccess: () => {
      utils.compras.getById.invalidate({ id });
      toast.success("Cotação selecionada — compra aprovada");
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-8 w-1/3 bg-muted rounded" />
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-card border border-border rounded-xl p-5 h-64" />
          <div className="bg-card border border-border rounded-xl p-5 h-64" />
        </div>
      </div>
    );
  }

  if (!compra) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium text-foreground">Compra não encontrada</p>
        <Link
          href="/compras"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Compras
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Back link */}
      <Link
        href="/compras"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Compras
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-muted-foreground font-mono">
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
          <h1 className="text-xl font-heading font-bold">{compra.name}</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            {compra.deadline && (
              <span>Prazo: {formatDate(compra.deadline)}</span>
            )}
            {compra.orcamento && (
              <span>Orçamento: {compra.orcamento.name}</span>
            )}
          </div>
        </div>
        <StatusChangeButton compraId={compra.id} currentStatus={compra.status} />
      </div>

      {/* Two-column detail */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* LEFT — Itens */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
          <h2 className="font-heading font-bold text-base">
            Itens{" "}
            <span className="text-muted-foreground font-normal text-sm">
              ({compra.items.length})
            </span>
          </h2>

          {compra.items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhum item cadastrado
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-left font-medium text-muted-foreground text-xs">
                      Descrição
                    </th>
                    <th className="pb-2 text-left font-medium text-muted-foreground text-xs">
                      Un.
                    </th>
                    <th className="pb-2 text-right font-medium text-muted-foreground text-xs">
                      Qtd
                    </th>
                    <th className="pb-2 text-right font-medium text-muted-foreground text-xs">
                      Preço Est.
                    </th>
                    <th className="pb-2 text-center font-medium text-muted-foreground text-xs">
                      ABC
                    </th>
                    <th className="pb-2 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {compra.items.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2 pr-2">
                        <p className="font-medium leading-tight">
                          {item.description}
                        </p>
                        {item.category && (
                          <p className="text-xs text-muted-foreground">
                            {item.category}
                          </p>
                        )}
                      </td>
                      <td className="py-2 text-muted-foreground text-xs">
                        {item.unit}
                      </td>
                      <td className="py-2 text-right text-muted-foreground">
                        {Number(item.quantity).toLocaleString("pt-BR", { maximumFractionDigits: 4 })}
                      </td>
                      <td className="py-2 text-right text-muted-foreground">
                        {item.estimatedPrice
                          ? formatCurrency(Number(item.estimatedPrice))
                          : "—"}
                      </td>
                      <td className="py-2 text-center">
                        {item.abcClass && (
                          <span
                            className={cn(
                              "text-xs px-1.5 py-0.5 rounded border font-medium",
                              ABC_COLORS[item.abcClass] ??
                                "bg-muted text-muted-foreground border-border"
                            )}
                          >
                            {item.abcClass}
                          </span>
                        )}
                      </td>
                      <td className="py-2">
                        <button
                          onClick={() => removeItem.mutate({ id: item.id })}
                          disabled={removeItem.isPending}
                          className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-50"
                          title="Remover item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <AddItemForm compraId={compra.id} onDone={() => {}} />
        </div>

        {/* RIGHT — Cotações */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
          <h2 className="font-heading font-bold text-base">
            Cotações{" "}
            <span className="text-muted-foreground font-normal text-sm">
              ({compra.cotacoes.length})
            </span>
          </h2>

          {compra.cotacoes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhuma cotação adicionada
            </p>
          ) : (
            <div className="space-y-3">
              {compra.cotacoes.map((cotacao) => (
                <div
                  key={cotacao.id}
                  className={cn(
                    "border rounded-xl p-4 transition-all",
                    cotacao.selected
                      ? "border-green-300 bg-green-50"
                      : "border-border bg-background hover:border-primary/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium text-sm truncate">
                          {cotacao.supplier}
                        </p>
                        {cotacao.selected && (
                          <span className="flex items-center gap-0.5 text-xs text-green-700 font-medium whitespace-nowrap">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Selecionada
                          </span>
                        )}
                      </div>
                      {cotacao.contactName && (
                        <p className="text-xs text-muted-foreground">
                          {cotacao.contactName}
                          {cotacao.contactPhone
                            ? ` — ${cotacao.contactPhone}`
                            : ""}
                        </p>
                      )}
                    </div>
                    <p className="text-lg font-heading font-bold text-primary whitespace-nowrap">
                      {formatCurrency(Number(cotacao.totalValue))}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="text-xs text-muted-foreground">
                      {cotacao.validUntil ? (
                        <span>Válido até {formatDate(cotacao.validUntil)}</span>
                      ) : (
                        <span>Sem prazo de validade</span>
                      )}
                      {cotacao.notes && (
                        <p className="mt-0.5 italic">{cotacao.notes}</p>
                      )}
                    </div>
                    {!cotacao.selected && (
                      <button
                        onClick={() =>
                          selectCotacao.mutate({ id: cotacao.id })
                        }
                        disabled={selectCotacao.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors whitespace-nowrap"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Selecionar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <AddCotacaoForm compraId={compra.id} onDone={() => {}} />
        </div>
      </div>
    </div>
  );
}
