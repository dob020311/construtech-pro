"use client";

import { trpc } from "@/lib/trpc";
import {
  Bot, Clock, CheckCircle2, XCircle, AlertTriangle, Play, RefreshCw,
  Plus, Trash2, Settings, X, Loader2, FileSearch, ShieldCheck, DollarSign,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

const JOB_TYPE_META = {
  EDITAL_SEARCH: {
    label: "Busca de Editais",
    desc: "Pesquisa novos editais no PNCP e portais de licitações conforme palavras-chave.",
    icon: FileSearch,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  DOCUMENT_CHECK: {
    label: "Verificação de Documentos",
    desc: "Verifica documentos prestes a vencer e atualiza status automaticamente.",
    icon: ShieldCheck,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  PRICE_UPDATE: {
    label: "Atualização de Preços SINAPI",
    desc: "Consulta tabela SINAPI/SICRO e atualiza referências de preços.",
    icon: DollarSign,
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-950/30",
  },
} as const;

type JobType = keyof typeof JOB_TYPE_META;

/* ── Create/Edit Modal ── */
function JobModal({
  initial,
  onClose,
}: {
  initial?: { id: string; name: string; type: JobType; schedule: string | null; config: Record<string, unknown> };
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<JobType>(initial?.type ?? "EDITAL_SEARCH");
  const [schedule, setSchedule] = useState(initial?.schedule ?? "0 6 * * *");
  const [keywords, setKeywords] = useState(
    ((initial?.config?.keywords as string[] | undefined) ?? []).join(", ")
  );
  const [uf, setUf] = useState((initial?.config?.uf as string | undefined) ?? "BA");

  const createJob = trpc.rpa.createJob.useMutation({
    onSuccess: () => { utils.rpa.listJobs.invalidate(); toast.success("Agente criado"); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const updateJob = trpc.rpa.updateJob.useMutation({
    onSuccess: () => { utils.rpa.listJobs.invalidate(); toast.success("Agente atualizado"); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const save = () => {
    const config = {
      keywords: keywords.split(",").map(k => k.trim()).filter(Boolean),
      uf,
    };
    if (initial) {
      updateJob.mutate({ id: initial.id, name, schedule, config });
    } else {
      createJob.mutate({ name, type, schedule, config });
    }
  };

  const isPending = createJob.isPending || updateJob.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-heading font-semibold text-sm">{initial ? "Editar Agente" : "Novo Agente"}</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nome</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="ex: Busca Pavimentação BA"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          {!initial && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tipo de Agente</label>
              <select value={type} onChange={e => setType(e.target.value as JobType)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                {Object.entries(JOB_TYPE_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          )}
          {(type === "EDITAL_SEARCH" || initial?.type === "EDITAL_SEARCH") && (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Palavras-chave (separadas por vírgula)</label>
                <input value={keywords} onChange={e => setKeywords(e.target.value)}
                  placeholder="pavimentação, saneamento, obras civis"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Estado (UF)</label>
                <input value={uf} onChange={e => setUf(e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="BA"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </>
          )}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Agendamento (cron)</label>
            <input value={schedule} onChange={e => setSchedule(e.target.value)}
              placeholder="0 6 * * * (todo dia às 6h)"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <p className="text-[11px] text-muted-foreground mt-1">Ex: <code>0 6 * * *</code> = 6h diário · <code>0 8 * * 1</code> = segunda às 8h</p>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-border">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Cancelar</button>
          <button onClick={save} disabled={!name || isPending}
            className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {initial ? "Salvar" : "Criar Agente"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Log Panel ── */
function LogPanel({ jobId }: { jobId: string }) {
  const { data: logs } = trpc.rpa.getLogs.useQuery({ jobId, limit: 10 });
  if (!logs?.length) return <p className="text-xs text-muted-foreground py-2">Nenhuma execução registrada.</p>;
  return (
    <div className="mt-3 space-y-1.5">
      {logs.map(log => (
        <div key={log.id} className="flex items-start gap-2 text-xs">
          {log.status === "SUCCESS"
            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
            : <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0">
            <span className="text-foreground">{log.message ?? log.status}</span>
            {log.itemsFound > 0 && <span className="ml-1 text-primary">({log.itemsFound} itens)</span>}
          </div>
          <span className="text-muted-foreground whitespace-nowrap">{new Date(log.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Job Card ── */
function JobCard({ job }: { job: {
  id: string; name: string; type: string; isActive: boolean;
  schedule: string | null; lastRunAt: Date | null; lastRunStatus: string | null;
  config: Record<string, unknown>;
  logs: { id: string; status: string; message: string | null; itemsFound: number; createdAt: Date }[];
} }) {
  const meta = JOB_TYPE_META[job.type as JobType] ?? JOB_TYPE_META.EDITAL_SEARCH;
  const Icon = meta.icon;
  const utils = trpc.useUtils();
  const [showLogs, setShowLogs] = useState(false);
  const [editing, setEditing] = useState(false);

  const runJob = trpc.rpa.runJob.useMutation({
    onSuccess: (res) => {
      utils.rpa.listJobs.invalidate();
      toast.success(res.message);
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleActive = trpc.rpa.updateJob.useMutation({
    onSuccess: () => utils.rpa.listJobs.invalidate(),
  });

  const deleteJob = trpc.rpa.deleteJob.useMutation({
    onSuccess: () => { utils.rpa.listJobs.invalidate(); toast.success("Agente removido"); },
  });

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", meta.bg)}>
              <Icon className={cn("w-5 h-5", meta.color)} />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{job.name}</p>
              <p className="text-xs text-muted-foreground">{meta.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleActive.mutate({ id: job.id, isActive: !job.isActive })}
              className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0",
                job.isActive ? "bg-primary" : "bg-muted")}
            >
              <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                job.isActive ? "translate-x-4" : "translate-x-0.5")} />
            </button>
            <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => { if (confirm("Remover este agente?")) deleteJob.mutate({ id: job.id }); }}
              className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{meta.desc}</p>

        {job.type === "EDITAL_SEARCH" && (job.config as any)?.keywords?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {((job.config as any).keywords as string[]).map((k: string) => (
              <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{k}</span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {job.schedule && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.schedule}</span>}
            {job.lastRunAt && (
              <span className={cn("flex items-center gap-1",
                job.lastRunStatus === "SUCCESS" ? "text-emerald-600" :
                job.lastRunStatus === "FAILED" ? "text-red-500" : "text-muted-foreground")}>
                {job.lastRunStatus === "SUCCESS" ? <CheckCircle2 className="w-3 h-3" /> :
                 job.lastRunStatus === "FAILED" ? <XCircle className="w-3 h-3" /> :
                 <AlertTriangle className="w-3 h-3" />}
                {formatDate(job.lastRunAt)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowLogs(v => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              {showLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Logs
            </button>
            <button
              onClick={() => runJob.mutate({ id: job.id })}
              disabled={runJob.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {runJob.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              Executar
            </button>
          </div>
        </div>
        {showLogs && <LogPanel jobId={job.id} />}
      </div>
      {editing && (
        <JobModal
          initial={{ id: job.id, name: job.name, type: job.type as JobType, schedule: job.schedule, config: job.config as Record<string, unknown> }}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}

/* ── Main ── */
export function RpaContent() {
  const { data: jobs, isLoading, refetch } = trpc.rpa.listJobs.useQuery();
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Automações RPA</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Agentes de captura e análise automática de editais</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setCreating(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Novo Agente
          </button>
        </div>
      </div>

      {/* Agent type guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Object.entries(JOB_TYPE_META).map(([, meta]) => {
          const Icon = meta.icon;
          return (
            <div key={meta.label} className={cn("rounded-xl p-4 border border-border flex items-start gap-3", meta.bg)}>
              <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", meta.color)} />
              <div>
                <p className={cn("text-sm font-semibold", meta.color)}>{meta.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{meta.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Jobs list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : !jobs || jobs.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center">
          <Bot className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-medium text-foreground">Nenhum agente configurado</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Crie seu primeiro agente para começar</p>
          <button onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Criar Agente
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={{
              ...job,
              config: (job.config ?? {}) as Record<string, unknown>,
              logs: job.logs.map(l => ({ ...l, createdAt: new Date(l.createdAt) })),
              lastRunAt: job.lastRunAt ? new Date(job.lastRunAt) : null,
            }} />
          ))}
        </div>
      )}

      {creating && <JobModal onClose={() => setCreating(false)} />}
    </div>
  );
}
