"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import Link from "next/link";
import { Plus, Calculator, ExternalLink, Clock, FileText, X } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Rascunho",
  IN_PROGRESS: "Em Andamento",
  REVIEW: "Em Revisão",
  APPROVED: "Aprovado",
  SUBMITTED: "Enviado",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
  IN_PROGRESS: "bg-amber-100 text-amber-700 border-amber-200",
  REVIEW: "bg-blue-100 text-blue-700 border-blue-200",
  APPROVED: "bg-green-100 text-green-700 border-green-200",
  SUBMITTED: "bg-purple-100 text-purple-700 border-purple-200",
};

function NovoOrcamentoModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [bdi, setBdi] = useState("25");
  const [error, setError] = useState("");

  const { data: licitacoes } = trpc.licitacao.list.useQuery({ page: 1, limit: 50 });
  const [licitacaoId, setLicitacaoId] = useState("");

  const utils = trpc.useUtils();
  const create = trpc.orcamento.create.useMutation({
    onSuccess: (data) => {
      utils.orcamento.list.invalidate();
      onClose();
      router.push(`/orcamentos/${data.id}`);
    },
    onError: (err) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Informe um nome para o orçamento"); return; }
    create.mutate({
      name: name.trim(),
      licitacaoId: licitacaoId || undefined,
      bdiPercentage: parseFloat(bdi) || 25,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-heading font-bold">Novo Orçamento</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Nome do Orçamento *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Orçamento — PE 042/2024"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Licitação Vinculada (opcional)</label>
            <select
              value={licitacaoId}
              onChange={(e) => setLicitacaoId(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="">Nenhuma</option>
              {licitacoes?.items.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.number} — {l.organ}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">BDI (%)</label>
            <input
              type="number"
              value={bdi}
              onChange={(e) => setBdi(e.target.value)}
              min="0"
              max="100"
              step="0.01"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3 pt-2">
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
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {create.isPending ? "Criando..." : "Criar Orçamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function OrcamentosContent() {
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const { data, isLoading } = trpc.orcamento.list.useQuery({ page, limit: 20 });

  return (
    <div className="space-y-5">
      {showModal && <NovoOrcamentoModal onClose={() => setShowModal(false)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Orçamentos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {data?.total ?? 0} orçamentos no sistema
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Novo Orçamento
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
              <div className="skeleton h-4 w-3/4 rounded mb-3" />
              <div className="skeleton h-3 w-1/2 rounded mb-4" />
              <div className="skeleton h-6 w-24 rounded-full mb-4" />
              <div className="skeleton h-8 w-40 rounded" />
            </div>
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-20 text-center text-muted-foreground">
          <Calculator className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-foreground">Nenhum orçamento criado</p>
          <p className="text-sm mt-1">Crie seu primeiro orçamento clicando em "Novo Orçamento"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data?.items.map((orc) => (
            <Link
              key={orc.id}
              href={`/orcamentos/${orc.id}`}
              className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-heading font-semibold text-sm leading-tight line-clamp-2 flex-1">
                  {orc.name}
                </h3>
                <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
              </div>

              {orc.licitacao && (
                <p className="text-xs text-muted-foreground mb-3 truncate">
                  <FileText className="w-3 h-3 inline mr-1" />
                  {orc.licitacao.number} — {orc.licitacao.organ}
                </p>
              )}

              <div className="flex items-center gap-2 mb-4">
                <span className={cn("status-badge text-xs", STATUS_COLORS[orc.status])}>
                  {STATUS_LABELS[orc.status]}
                </span>
                <span className="text-xs text-muted-foreground">v{orc.version}</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Total com BDI</p>
                  <p className="text-lg font-heading font-bold text-primary">
                    {formatCurrency(Number(orc.totalWithBdi))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {orc._count.chapters} capítulos
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Clock className="w-3 h-3" />
                    {formatDate(orc.updatedAt)}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
