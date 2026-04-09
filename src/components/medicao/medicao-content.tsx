"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Plus, Ruler, X, ChevronLeft, ChevronRight, Calendar, FileText } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
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

function NovaMedicaoModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [orcamentoId, setOrcamentoId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const { data: orcamentos } = trpc.orcamento.list.useQuery({ page: 1, limit: 100 });

  const utils = trpc.useUtils();
  const create = trpc.medicao.create.useMutation({
    onSuccess: (data) => {
      utils.medicao.list.invalidate();
      toast.success("Medição criada com sucesso!");
      onClose();
      router.push(`/medicao/${data.id}`);
    },
    onError: (err) => {
      setError(err.message);
      toast.error("Erro ao criar medição");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Informe um nome para a medição"); return; }
    if (!orcamentoId) { setError("Selecione um orçamento"); return; }
    if (!startDate) { setError("Informe a data de início"); return; }
    if (!endDate) { setError("Informe a data de término"); return; }
    if (new Date(endDate) < new Date(startDate)) {
      setError("A data de término deve ser posterior à data de início");
      return;
    }
    create.mutate({
      name: name.trim(),
      orcamentoId,
      startDate,
      endDate,
      description: description.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-heading font-bold">Nova Medição</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Nome da Medição *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Medição 01 — Fundações"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Orçamento *</label>
            <select
              value={orcamentoId}
              onChange={(e) => setOrcamentoId(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="">Selecione um orçamento</option>
              {orcamentos?.items.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Data Início *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Data Término *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Descrição (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva os serviços a serem medidos..."
              rows={3}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
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
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {create.isPending ? "Criando..." : "Criar Medição"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function MedicaoContent() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<MedicaoStatus | "">("");

  const { data, isLoading } = trpc.medicao.list.useQuery({
    page,
    limit: 20,
    status: statusFilter || undefined,
  });

  return (
    <div className="space-y-5">
      {showModal && <NovaMedicaoModal onClose={() => setShowModal(false)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Medições</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {data?.total ?? 0} medição(ões) no sistema
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nova Medição
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as MedicaoStatus | ""); setPage(1); }}
          className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        >
          <option value="">Todos os Status</option>
          {(Object.keys(STATUS_LABELS) as MedicaoStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-3" />
              <div className="h-3 bg-muted rounded w-1/2 mb-4" />
              <div className="h-6 bg-muted rounded-full w-24 mb-4" />
              <div className="h-8 bg-muted rounded w-40" />
            </div>
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-20 text-center text-muted-foreground">
          <Ruler className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-foreground">Nenhuma medição encontrada</p>
          <p className="text-sm mt-1">
            {statusFilter
              ? "Tente remover o filtro de status"
              : 'Crie sua primeira medição clicando em "Nova Medição"'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data?.items.map((med) => (
              <button
                key={med.id}
                onClick={() => router.push(`/medicao/${med.id}`)}
                className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all text-left group w-full"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Medição #{med.number}
                    </p>
                    <h3 className="font-heading font-semibold text-sm leading-tight line-clamp-2">
                      {med.name}
                    </h3>
                  </div>
                </div>

                {med.orcamento && (
                  <p className="text-xs text-muted-foreground mb-3 truncate">
                    <FileText className="w-3 h-3 inline mr-1" />
                    {med.orcamento.name}
                  </p>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                      STATUS_COLORS[med.status]
                    )}
                  >
                    {STATUS_LABELS[med.status]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {med._count.items} iten(s)
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground pt-3 border-t border-border">
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  <span>
                    {formatDate(med.startDate)} — {formatDate(med.endDate)}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {data && data.pages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} de {data.total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                      page === p ? "bg-primary text-white" : "hover:bg-muted"
                    )}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === data.pages}
                  className="p-2 rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
