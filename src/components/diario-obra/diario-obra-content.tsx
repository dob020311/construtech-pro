"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { cn, formatDate } from "@/lib/utils";
import { Plus, BookOpen, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { DiarioShift, DiarioWeather } from "@prisma/client";

// ─── Labels & helpers ────────────────────────────────────────────────────────

export const SHIFT_LABELS: Record<DiarioShift, string> = {
  MORNING: "Manhã",
  AFTERNOON: "Tarde",
  NIGHT: "Noite",
  FULL_DAY: "Dia Todo",
};

export const SHIFT_COLORS: Record<DiarioShift, string> = {
  MORNING: "bg-amber-100 text-amber-700 border-amber-200",
  AFTERNOON: "bg-orange-100 text-orange-700 border-orange-200",
  NIGHT: "bg-indigo-100 text-indigo-700 border-indigo-200",
  FULL_DAY: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export const WEATHER_LABELS: Record<DiarioWeather, string> = {
  SUNNY: "Ensolarado",
  CLOUDY: "Nublado",
  RAINY: "Chuvoso",
  STORM: "Tempestade",
  PARTIAL: "Parcialmente Nublado",
};

export const WEATHER_EMOJI: Record<DiarioWeather, string> = {
  SUNNY: "☀️",
  CLOUDY: "☁️",
  RAINY: "🌧️",
  STORM: "⛈️",
  PARTIAL: "🌤️",
};

// ─── Modal form ───────────────────────────────────────────────────────────────

interface ModalProps {
  onClose: () => void;
}

function NovoRegistroModal({ onClose }: ModalProps) {
  const utils = trpc.useUtils();
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    orcamentoId: "",
    shift: "MORNING" as DiarioShift,
    weather: "SUNNY" as DiarioWeather,
    laborCount: "",
    description: "",
    occurrences: "",
    materials: "",
    equipment: "",
  });

  const { data: orcamentos } = trpc.orcamento.list.useQuery({ page: 1, limit: 100 });

  const create = trpc.diarioObra.create.useMutation({
    onSuccess: () => {
      utils.diarioObra.list.invalidate();
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
    create.mutate({
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
          <h2 className="text-lg font-heading font-bold">Novo Registro de Diário</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Row 1: date + shift */}
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

          {/* Row 2: weather + laborCount */}
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
              <label className="block text-sm font-medium mb-1.5">
                Nº de Trabalhadores
              </label>
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

          {/* Orcamento */}
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

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Descrição das Atividades *
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              placeholder="Descreva as atividades realizadas no dia..."
              className={inputCls}
              required
            />
          </div>

          {/* Occurrences */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Ocorrências / Observações
            </label>
            <textarea
              value={form.occurrences}
              onChange={(e) => set("occurrences", e.target.value)}
              rows={3}
              placeholder="Registre ocorrências relevantes, problemas ou observações..."
              className={inputCls}
            />
          </div>

          {/* Materials */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Materiais Utilizados
            </label>
            <textarea
              value={form.materials}
              onChange={(e) => set("materials", e.target.value)}
              rows={2}
              placeholder="Liste os materiais consumidos..."
              className={inputCls}
            />
          </div>

          {/* Equipment */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Equipamentos Utilizados
            </label>
            <textarea
              value={form.equipment}
              onChange={(e) => set("equipment", e.target.value)}
              rows={2}
              placeholder="Liste os equipamentos utilizados..."
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
              disabled={create.isPending}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {create.isPending ? "Salvando..." : "Salvar Registro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main list component ──────────────────────────────────────────────────────

export function DiarioObraContent() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = trpc.diarioObra.list.useQuery({ page, limit: 20 });

  return (
    <div className="space-y-5">
      {showModal && <NovoRegistroModal onClose={() => setShowModal(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Diário de Obras</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {data?.total ?? 0} registro{(data?.total ?? 0) !== 1 ? "s" : ""} no sistema
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Novo Registro
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-5 animate-pulse"
            >
              <div className="skeleton h-4 w-1/4 rounded mb-3" />
              <div className="skeleton h-3 w-3/4 rounded mb-2" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-20 text-center text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-foreground">Nenhum registro criado</p>
          <p className="text-sm mt-1">
            Clique em &quot;Novo Registro&quot; para começar o diário de obras.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data?.items.map((entry) => (
              <button
                key={entry.id}
                onClick={() => router.push(`/diario-obra/${entry.id}`)}
                className="w-full text-left bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: date + badges */}
                  <div className="flex items-start gap-4 min-w-0">
                    {/* Date block */}
                    <div className="flex-shrink-0 bg-primary/5 border border-primary/15 rounded-lg px-3 py-2 text-center min-w-[56px]">
                      <p className="text-xs text-muted-foreground leading-none">
                        {new Date(entry.date).toLocaleDateString("pt-BR", {
                          month: "short",
                        })}
                      </p>
                      <p className="text-xl font-heading font-bold text-primary leading-tight">
                        {new Date(entry.date).getDate().toString().padStart(2, "0")}
                      </p>
                      <p className="text-xs text-muted-foreground leading-none">
                        {new Date(entry.date).getFullYear()}
                      </p>
                    </div>

                    {/* Main info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                            SHIFT_COLORS[entry.shift]
                          )}
                        >
                          {SHIFT_LABELS[entry.shift]}
                        </span>
                        <span className="text-base" title={WEATHER_LABELS[entry.weather]}>
                          {WEATHER_EMOJI[entry.weather]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {WEATHER_LABELS[entry.weather]}
                        </span>
                        {entry.laborCount !== null && entry.laborCount !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            · {entry.laborCount} trabalhador
                            {entry.laborCount !== 1 ? "es" : ""}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-foreground line-clamp-2">
                        {entry.description.length > 100
                          ? entry.description.slice(0, 100) + "…"
                          : entry.description}
                      </p>

                      {entry.orcamento && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          Orçamento: {entry.orcamento.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: created by */}
                  <div className="flex-shrink-0 text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground">
                      {entry.createdBy.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(entry.createdAt)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Pagination */}
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
