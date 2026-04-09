"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { cn, formatDate } from "@/lib/utils";
import {
  Plus,
  CalendarDays,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  Users,
} from "lucide-react";
import { toast } from "sonner";

// ─── types ────────────────────────────────────────────────────────────────────

interface Task {
  id: string;
  name: string;
  code: string | null;
  orcamentoId: string | null;
  companyId: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  laborCount: number | null;
  notes: string | null;
  dependsOn: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
  orcamento: { id: string; name: string } | null;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function progressColor(p: number): string {
  if (p === 100) return "bg-green-500";
  if (p >= 71) return "bg-blue-500";
  if (p >= 31) return "bg-amber-500";
  return "bg-red-500";
}

function progressTextColor(p: number): string {
  if (p === 100) return "text-green-700 bg-green-100 border-green-200";
  if (p >= 71) return "text-blue-700 bg-blue-100 border-blue-200";
  if (p >= 31) return "text-amber-700 bg-amber-100 border-amber-200";
  return "text-red-700 bg-red-100 border-red-200";
}

function calcDuration(start: Date, end: Date): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function toDateInput(d: Date): string {
  return new Date(d).toISOString().slice(0, 10);
}

// ─── Nova Tarefa Modal ─────────────────────────────────────────────────────────

interface NovaTarefaModalProps {
  onClose: () => void;
  editTask?: Task;
}

function NovaTarefaModal({ onClose, editTask }: NovaTarefaModalProps) {
  const [name, setName] = useState(editTask?.name ?? "");
  const [code, setCode] = useState(editTask?.code ?? "");
  const [orcamentoId, setOrcamentoId] = useState(editTask?.orcamentoId ?? "");
  const [startDate, setStartDate] = useState(
    editTask ? toDateInput(editTask.startDate) : ""
  );
  const [endDate, setEndDate] = useState(
    editTask ? toDateInput(editTask.endDate) : ""
  );
  const [laborCount, setLaborCount] = useState(
    editTask?.laborCount?.toString() ?? ""
  );
  const [notes, setNotes] = useState(editTask?.notes ?? "");
  const [error, setError] = useState("");

  const utils = trpc.useUtils();
  const { data: orcamentosData } = trpc.orcamento.list.useQuery({
    page: 1,
    limit: 100,
  });

  const create = trpc.planejamento.create.useMutation({
    onSuccess: () => {
      utils.planejamento.list.invalidate();
      toast.success("Tarefa criada com sucesso");
      onClose();
    },
    onError: (err) => setError(err.message),
  });

  const update = trpc.planejamento.update.useMutation({
    onSuccess: () => {
      utils.planejamento.list.invalidate();
      toast.success("Tarefa atualizada");
      onClose();
    },
    onError: (err) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Informe o nome da tarefa"); return; }
    if (!startDate) { setError("Informe a data de início"); return; }
    if (!endDate) { setError("Informe a data de término"); return; }
    if (new Date(endDate) < new Date(startDate)) {
      setError("A data de término deve ser posterior à data de início");
      return;
    }

    const payload = {
      name: name.trim(),
      code: code.trim() || undefined,
      orcamentoId: orcamentoId || undefined,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      laborCount: laborCount ? parseInt(laborCount) : undefined,
      notes: notes.trim() || undefined,
    };

    if (editTask) {
      update.mutate({ id: editTask.id, ...payload });
    } else {
      create.mutate(payload);
    }
  }

  const isPending = create.isPending || update.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-heading font-bold">
            {editTask ? "Editar Tarefa" : "Nova Tarefa"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1.5">
                Nome da Tarefa *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Fundação — Bloco A"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Código (opcional)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: 1.1.2"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Mão de Obra
              </label>
              <input
                type="number"
                value={laborCount}
                onChange={(e) => setLaborCount(e.target.value)}
                min="0"
                placeholder="0"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Data de Início *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Data de Término *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div className="col-span-2">
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

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1.5">
                Observações
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Observações sobre a tarefa..."
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />
            </div>
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
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isPending
                ? editTask
                  ? "Salvando..."
                  : "Criando..."
                : editTask
                ? "Salvar Alterações"
                : "Criar Tarefa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Progress Click Modal ──────────────────────────────────────────────────────

function ProgressModal({
  task,
  onClose,
}: {
  task: Task;
  onClose: () => void;
}) {
  const [value, setValue] = useState(task.progress.toString());
  const utils = trpc.useUtils();

  const updateProgress = trpc.planejamento.updateProgress.useMutation({
    onSuccess: () => {
      utils.planejamento.list.invalidate();
      toast.success("Progresso atualizado");
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p = Math.min(100, Math.max(0, parseInt(value) || 0));
    updateProgress.mutate({ id: task.id, progress: p });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold">Atualizar Progresso</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4 truncate">
          {task.name}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Progresso (%)
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              min="0"
              max="100"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              autoFocus
            />
            <input
              type="range"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              min="0"
              max="100"
              step="5"
              className="w-full mt-2 accent-primary"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateProgress.isPending}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {updateProgress.isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function PlanejamentoContent() {
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | undefined>(undefined);
  const [progressTask, setProgressTask] = useState<Task | undefined>(undefined);
  const [orcamentoFilter, setOrcamentoFilter] = useState("");

  const { data: tasks, isLoading } = trpc.planejamento.list.useQuery({
    orcamentoId: orcamentoFilter || undefined,
  });

  const { data: orcamentosData } = trpc.orcamento.list.useQuery({
    page: 1,
    limit: 100,
  });

  const utils = trpc.useUtils();

  const deleteTask = trpc.planejamento.delete.useMutation({
    onSuccess: () => {
      utils.planejamento.list.invalidate();
      toast.success("Tarefa removida");
    },
    onError: (err) => toast.error(err.message),
  });

  function handleDelete(id: string) {
    if (confirm("Deseja remover esta tarefa?")) {
      deleteTask.mutate({ id });
    }
  }

  // Summary stats
  const totalTasks = tasks?.length ?? 0;
  const avgProgress =
    totalTasks > 0
      ? Math.round(
          (tasks ?? []).reduce((sum, t) => sum + t.progress, 0) / totalTasks
        )
      : 0;
  const completedTasks = (tasks ?? []).filter((t) => t.progress === 100).length;

  return (
    <div className="space-y-5">
      {showModal && (
        <NovaTarefaModal
          onClose={() => { setShowModal(false); setEditTask(undefined); }}
          editTask={editTask}
        />
      )}
      {progressTask && (
        <ProgressModal
          task={progressTask}
          onClose={() => setProgressTask(undefined)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Planejamento</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Cronograma e progresso das tarefas da obra
          </p>
        </div>
        <button
          onClick={() => { setEditTask(undefined); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nova Tarefa
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total de Tarefas</p>
          <p className="text-2xl font-heading font-bold">{totalTasks}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Progresso Médio</p>
          <p className="text-2xl font-heading font-bold">{avgProgress}%</p>
          <div className="w-full h-1.5 bg-muted rounded-full mt-2">
            <div
              className={cn("h-1.5 rounded-full transition-all", progressColor(avgProgress))}
              style={{ width: `${avgProgress}%` }}
            />
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Concluídas</p>
          <p className="text-2xl font-heading font-bold">{completedTasks}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            de {totalTasks} tarefas
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          Filtrar por orçamento:
        </label>
        <div className="relative">
          <select
            value={orcamentoFilter}
            onChange={(e) => setOrcamentoFilter(e.target.value)}
            className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none pr-7"
          >
            <option value="">Todos</option>
            {orcamentosData?.items.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="bg-card border border-border rounded-xl p-8">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-4 w-16 bg-muted rounded" />
                <div className="h-4 flex-1 bg-muted rounded" />
                <div className="h-4 w-8 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-4 w-32 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : tasks?.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-20 text-center text-muted-foreground">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-foreground">Nenhuma tarefa criada</p>
          <p className="text-sm mt-1">
            Crie sua primeira tarefa clicando em "Nova Tarefa"
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Código
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Tarefa
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      M.O.
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Início
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Fim
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground min-w-[180px]">
                    Progresso
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Duração
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tasks?.map((task) => {
                  const duration = calcDuration(task.startDate, task.endDate);
                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {task.code ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium leading-tight">{task.name}</p>
                        {task.orcamento && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {task.orcamento.name}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {task.laborCount ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(task.startDate)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(task.endDate)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setProgressTask(task as Task)}
                          className="w-full group flex items-center gap-2 text-left"
                          title="Clique para atualizar progresso"
                        >
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-2 rounded-full transition-all",
                                progressColor(task.progress)
                              )}
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                          <span
                            className={cn(
                              "text-xs font-medium px-1.5 py-0.5 rounded border whitespace-nowrap",
                              progressTextColor(task.progress)
                            )}
                          >
                            {task.progress}%
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {duration} dia{duration !== 1 ? "s" : ""}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditTask(task as Task);
                              setShowModal(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(task.id)}
                            disabled={deleteTask.isPending}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-50"
                            title="Remover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
