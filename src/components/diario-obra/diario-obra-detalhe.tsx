"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Printer,
  X,
  Calendar,
  Users,
  Cloud,
  FileText,
  AlertTriangle,
  Package,
  Wrench,
} from "lucide-react";
import type { DiarioShift, DiarioWeather } from "@prisma/client";
import {
  SHIFT_LABELS,
  SHIFT_COLORS,
  WEATHER_LABELS,
  WEATHER_EMOJI,
} from "./diario-obra-content";

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface EditModalProps {
  entry: {
    id: string;
    date: Date;
    shift: DiarioShift;
    weather: DiarioWeather;
    laborCount: number | null;
    description: string;
    occurrences: string | null;
    materials: string | null;
    equipment: string | null;
    orcamentoId: string | null;
  };
  onClose: () => void;
}

function EditModal({ entry, onClose }: EditModalProps) {
  const utils = trpc.useUtils();
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    date: new Date(entry.date).toISOString().split("T")[0],
    orcamentoId: entry.orcamentoId ?? "",
    shift: entry.shift,
    weather: entry.weather,
    laborCount: entry.laborCount?.toString() ?? "",
    description: entry.description,
    occurrences: entry.occurrences ?? "",
    materials: entry.materials ?? "",
    equipment: entry.equipment ?? "",
  });

  const { data: orcamentos } = trpc.orcamento.list.useQuery({ page: 1, limit: 100 });

  const update = trpc.diarioObra.update.useMutation({
    onSuccess: () => {
      utils.diarioObra.list.invalidate();
      utils.diarioObra.getById.invalidate({ id: entry.id });
      onClose();
    },
    onError: (err) => setError(err.message),
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim()) {
      setError("A descrição das atividades é obrigatória.");
      return;
    }
    update.mutate({
      id: entry.id,
      date: form.date,
      shift: form.shift,
      weather: form.weather,
      description: form.description.trim(),
      orcamentoId: form.orcamentoId || undefined,
      laborCount: form.laborCount ? parseInt(form.laborCount, 10) : undefined,
      occurrences: form.occurrences.trim() || undefined,
      materials: form.materials.trim() || undefined,
      equipment: form.equipment.trim() || undefined,
    });
  }

  const inputCls =
    "w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-lg font-heading font-bold">Editar Registro</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Data *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Turno *</label>
              <select
                value={form.shift}
                onChange={(e) => set("shift", e.target.value as DiarioShift)}
                className={inputCls}
              >
                {(Object.keys(SHIFT_LABELS) as DiarioShift[]).map((s) => (
                  <option key={s} value={s}>
                    {SHIFT_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Condição Climática *</label>
              <select
                value={form.weather}
                onChange={(e) => set("weather", e.target.value as DiarioWeather)}
                className={inputCls}
              >
                {(Object.keys(WEATHER_LABELS) as DiarioWeather[]).map((w) => (
                  <option key={w} value={w}>
                    {WEATHER_EMOJI[w]} {WEATHER_LABELS[w]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Nº de Trabalhadores</label>
              <input
                type="number"
                min="0"
                value={form.laborCount}
                onChange={(e) => set("laborCount", e.target.value)}
                placeholder="Ex: 12"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Orçamento Vinculado (opcional)
            </label>
            <select
              value={form.orcamentoId}
              onChange={(e) => set("orcamentoId", e.target.value)}
              className={inputCls}
            >
              <option value="">Nenhum</option>
              {orcamentos?.items.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Descrição das Atividades *
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              className={inputCls}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Ocorrências / Observações
            </label>
            <textarea
              value={form.occurrences}
              onChange={(e) => set("occurrences", e.target.value)}
              rows={3}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Materiais Utilizados</label>
            <textarea
              value={form.materials}
              onChange={(e) => set("materials", e.target.value)}
              rows={2}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Equipamentos Utilizados
            </label>
            <textarea
              value={form.equipment}
              onChange={(e) => set("equipment", e.target.value)}
              rows={2}
              className={inputCls}
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
              disabled={update.isPending}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {update.isPending ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({ id, onClose }: { id: string; onClose: () => void }) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const del = trpc.diarioObra.delete.useMutation({
    onSuccess: () => {
      utils.diarioObra.list.invalidate();
      router.push("/diario-obra");
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h2 className="font-heading font-bold">Excluir Registro</h2>
            <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
          </div>
        </div>
        <p className="text-sm mb-6">
          Tem certeza que deseja excluir este registro do diário de obras?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => del.mutate({ id })}
            disabled={del.isPending}
            className="flex-1 px-4 py-2 bg-destructive text-white rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
          >
            {del.isPending ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section block ────────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  content,
}: {
  icon: React.ElementType;
  title: string;
  content: string;
}) {
  return (
    <div className="bg-muted/40 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-foreground whitespace-pre-wrap">{content}</p>
    </div>
  );
}

// ─── Main detail component ────────────────────────────────────────────────────

export function DiarioObraDetalhe({ id }: { id: string }) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const { data: entry, isLoading } = trpc.diarioObra.getById.useQuery({ id });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="skeleton h-8 w-1/3 rounded" />
        <div className="skeleton h-40 w-full rounded-xl" />
        <div className="skeleton h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="font-medium text-foreground">Registro não encontrado</p>
        <button
          onClick={() => router.push("/diario-obra")}
          className="mt-4 text-sm text-primary hover:underline"
        >
          Voltar ao Diário de Obras
        </button>
      </div>
    );
  }

  const dateObj = new Date(entry.date);

  return (
    <>
      {showEdit && (
        <EditModal entry={entry} onClose={() => setShowEdit(false)} />
      )}
      {showDelete && (
        <DeleteModal id={entry.id} onClose={() => setShowDelete(false)} />
      )}

      <div className="space-y-5 print:space-y-4">
        {/* Top bar — hidden on print */}
        <div className="flex items-center justify-between print:hidden">
          <button
            onClick={() => router.push("/diario-obra")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Editar
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-2 px-3 py-1.5 border border-destructive/30 text-destructive rounded-lg text-sm hover:bg-destructive/5 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </button>
          </div>
        </div>

        {/* Print header */}
        <div className="hidden print:block mb-4 border-b pb-4">
          <h1 className="text-xl font-bold">Diário de Obras</h1>
          <p className="text-sm text-gray-500">
            Emitido em {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>

        {/* Hero card */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex flex-wrap items-start gap-6">
            {/* Date block */}
            <div className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 text-center min-w-[72px]">
              <p className="text-xs text-muted-foreground">
                {dateObj.toLocaleDateString("pt-BR", { month: "short" })}
              </p>
              <p className="text-3xl font-heading font-bold text-primary">
                {dateObj.getDate().toString().padStart(2, "0")}
              </p>
              <p className="text-xs text-muted-foreground">{dateObj.getFullYear()}</p>
            </div>

            {/* Meta */}
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex flex-wrap gap-2 items-center">
                <span
                  className={cn(
                    "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
                    SHIFT_COLORS[entry.shift]
                  )}
                >
                  {SHIFT_LABELS[entry.shift]}
                </span>
                <span className="text-lg" title={WEATHER_LABELS[entry.weather]}>
                  {WEATHER_EMOJI[entry.weather]}
                </span>
                <span className="text-sm text-muted-foreground">
                  {WEATHER_LABELS[entry.weather]}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                {entry.laborCount !== null && entry.laborCount !== undefined && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Trabalhadores</p>
                      <p className="font-medium">{entry.laborCount}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Data</p>
                    <p className="font-medium">
                      {dateObj.toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Clima</p>
                    <p className="font-medium">{WEATHER_LABELS[entry.weather]}</p>
                  </div>
                </div>
              </div>

              {entry.orcamento && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Orçamento:</span>
                  <span className="font-medium">{entry.orcamento.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <Section
          icon={FileText}
          title="Descrição das Atividades"
          content={entry.description}
        />

        {/* Optional sections */}
        {entry.occurrences && (
          <Section
            icon={AlertTriangle}
            title="Ocorrências / Observações"
            content={entry.occurrences}
          />
        )}

        {entry.materials && (
          <Section
            icon={Package}
            title="Materiais Utilizados"
            content={entry.materials}
          />
        )}

        {entry.equipment && (
          <Section
            icon={Wrench}
            title="Equipamentos Utilizados"
            content={entry.equipment}
          />
        )}

        {/* Footer metadata */}
        <div className="border-t border-border pt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground print:text-gray-400">
          <span>Criado por: {entry.createdBy.name}</span>
          <span>Em: {formatDateTime(entry.createdAt)}</span>
          <span>Atualizado: {formatDateTime(entry.updatedAt)}</span>
          <span>ID: {entry.id}</span>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          .space-y-5 > *, .space-y-4 > * { visibility: visible; }
          [class*="print:hidden"] { display: none !important; }
        }
      `}</style>
    </>
  );
}
