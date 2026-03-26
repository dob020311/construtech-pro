"use client";

import { trpc } from "@/lib/trpc";
import {
  Bot, Clock, CheckCircle2, XCircle, Play, RefreshCw,
  Plus, Trash2, Settings, X, Loader2, FileSearch, ShieldCheck, DollarSign,
  ChevronDown, ChevronUp, ExternalLink, Building2, Check,
} from "lucide-react";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

const PORTAL_OPTIONS = [
  { id: "PNCP", label: "PNCP", desc: "Portal Nacional de Contratações Públicas", available: true },
  { id: "ComprasGov", label: "ComprasGov", desc: "Governo Federal (SIASG/UASG)", available: true },
  { id: "BLL", label: "BLL Compras", desc: "Bolsa de Licitações e Leilões", available: false },
  { id: "BB", label: "Portal BB", desc: "Banco do Brasil — Licitações-e", available: false },
];

const JOB_TYPE_META = {
  EDITAL_SEARCH: {
    label: "Busca de Editais",
    desc: "Pesquisa novos editais no PNCP, ComprasGov e outros portais conforme palavras-chave.",
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

interface EditalFound {
  title: string;
  organ: string;
  number: string;
  modality: string;
  portal: string;
  portalUrl: string | null;
  date: string;
  value: number | null;
  uf: string;
  city: string;
  keyword: string;
}

/* ── Edital Result Card ── */
function EditalCard({ edital }: { edital: EditalFound }) {
  const portalColor: Record<string, string> = {
    PNCP: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
    ComprasGov: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  };
  return (
    <div className="border border-border rounded-lg p-3 bg-background hover:shadow-sm transition-shadow space-y-2">
      <div className="flex items-start gap-2">
        <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">{edital.title}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{edital.organ}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", portalColor[edital.portal] ?? "bg-muted text-muted-foreground")}>
          {edital.portal}
        </span>
        <span className="text-[10px] text-muted-foreground">{edital.modality}</span>
        {edital.city && <span className="text-[10px] text-muted-foreground">{edital.city}/{edital.uf}</span>}
        {edital.value && (
          <span className="text-[10px] font-medium text-primary ml-auto">{formatCurrency(edital.value)}</span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          Publicado: {new Date(edital.date).toLocaleDateString("pt-BR")}
          {edital.number && ` · ${edital.number}`}
        </span>
        {edital.portalUrl && (
          <a href={edital.portalUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-primary hover:underline">
            Ver edital <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

/* ── Log Panel with edital results ── */
function LogPanel({ jobId, jobType, autoExpandLatest }: { jobId: string; jobType: string; autoExpandLatest?: boolean }) {
  const { data: logs } = trpc.rpa.getLogs.useQuery({ jobId, limit: 10 });
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Auto-expand latest log when it has editais
  const latestLog = logs?.[0];
  const latestDetails = latestLog?.details as { editais?: EditalFound[] } | null;
  const latestEditais = latestDetails?.editais ?? [];

  if (autoExpandLatest && latestLog && latestEditais.length > 0 && expandedLog === null) {
    setExpandedLog(latestLog.id);
  }

  if (!logs?.length) return <p className="text-xs text-muted-foreground py-2">Nenhuma execução registrada.</p>;

  return (
    <div className="mt-3 space-y-2">
      {logs.map(log => {
        const details = log.details as { editais?: EditalFound[] } | null;
        const editais = details?.editais ?? [];
        const isExpanded = expandedLog === log.id;

        return (
          <div key={log.id} className="border border-border rounded-lg overflow-hidden">
            <div className="flex items-start gap-2 text-xs p-2.5 bg-muted/30">
              {log.status === "SUCCESS"
                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                : <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <span className="text-foreground">{log.message ?? log.status}</span>
              </div>
              <span className="text-muted-foreground whitespace-nowrap flex-shrink-0">
                {new Date(log.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            {jobType === "EDITAL_SEARCH" && (
              <div className="px-2.5 py-2 border-t border-border bg-background">
                {editais.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">Nenhum edital encontrado nesta execução.</p>
                ) : (
                  <button
                    onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {isExpanded ? "Ocultar" : `Ver ${editais.length} edital(is) encontrado(s)`}
                  </button>
                )}
              </div>
            )}
            {isExpanded && editais.length > 0 && (
              <div className="p-2.5 space-y-2 border-t border-border">
                {editais.map((e, i) => <EditalCard key={i} edital={e} />)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

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
  const [portals, setPortals] = useState<string[]>(
    (initial?.config?.portals as string[] | undefined) ?? ["PNCP", "ComprasGov"]
  );

  const createJob = trpc.rpa.createJob.useMutation({
    onSuccess: () => { utils.rpa.listJobs.invalidate(); toast.success("Agente criado"); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const updateJob = trpc.rpa.updateJob.useMutation({
    onSuccess: () => { utils.rpa.listJobs.invalidate(); toast.success("Agente atualizado"); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const togglePortal = (id: string) =>
    setPortals(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const save = () => {
    const config = {
      keywords: keywords.split(",").map(k => k.trim()).filter(Boolean),
      uf,
      portals,
    };
    if (initial) {
      updateJob.mutate({ id: initial.id, name, schedule, config });
    } else {
      createJob.mutate({ name, type, schedule, config });
    }
  };

  const isPending = createJob.isPending || updateJob.isPending;
  const currentType = initial?.type ?? type;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background z-10">
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

          {currentType === "EDITAL_SEARCH" && (
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
                  className="w-32 px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Portais de Busca</label>
                <div className="space-y-2">
                  {PORTAL_OPTIONS.map(p => {
                    const selected = portals.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => { if (p.available) togglePortal(p.id); }}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                          p.available ? "cursor-pointer" : "cursor-not-allowed opacity-60",
                          selected && p.available ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                          selected && p.available ? "bg-primary border-primary" : "border-muted-foreground/40 bg-background"
                        )}>
                          {selected && p.available && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{p.label}</span>
                            {!p.available && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Em breve</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{p.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Agendamento automático</label>
            <select
              value={schedule}
              onChange={e => setSchedule(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Sem agendamento (manual)</option>
              <option value="0 7 * * *">Todo dia às 7h (recomendado)</option>
              <option value="0 6 * * 1">Toda segunda-feira às 6h</option>
              <option value="0 7 * * 1,3,5">Segunda, quarta e sexta às 7h</option>
              <option value="0 8 1 * *">Todo dia 1º do mês às 8h</option>
              <option value="daily">Diário (qualquer horário)</option>
            </select>
            <p className="text-[11px] text-muted-foreground mt-1">
              O agente será executado automaticamente pela plataforma no horário configurado.
            </p>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-border sticky bottom-0 bg-background">
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

/* ── Job Card ── */
function JobCard({ job }: {
  job: {
    id: string; name: string; type: string; isActive: boolean;
    schedule: string | null; lastRunAt: Date | null; lastRunStatus: string | null;
    config: Record<string, unknown>;
    logs: { id: string; status: string; message: string | null; itemsFound: number; createdAt: Date; details: unknown }[];
  }
}) {
  const meta = JOB_TYPE_META[job.type as JobType] ?? JOB_TYPE_META.EDITAL_SEARCH;
  const Icon = meta.icon;
  const utils = trpc.useUtils();
  const [showLogs, setShowLogs] = useState(false);
  const [editing, setEditing] = useState(false);

  const [autoExpand, setAutoExpand] = useState(false);

  const runJob = trpc.rpa.runJob.useMutation({
    onSuccess: (res) => {
      utils.rpa.listJobs.invalidate();
      utils.rpa.getLogs.invalidate({ jobId: job.id });
      toast.success(res.message);
      setShowLogs(true);
      setAutoExpand(true);
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleActive = trpc.rpa.updateJob.useMutation({
    onSuccess: () => utils.rpa.listJobs.invalidate(),
  });

  const deleteJob = trpc.rpa.deleteJob.useMutation({
    onSuccess: () => { utils.rpa.listJobs.invalidate(); toast.success("Agente removido"); },
  });

  const portals = (job.config?.portals as string[] | undefined) ?? [];

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

        {/* Keywords */}
        {job.type === "EDITAL_SEARCH" && (job.config as any)?.keywords?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {((job.config as any).keywords as string[]).map((k: string) => (
              <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{k}</span>
            ))}
            {portals.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {portals.join(" · ")} · {(job.config as any)?.uf ?? "BA"}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {job.schedule && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {job.schedule === "0 7 * * *" ? "Diário 7h" :
                 job.schedule === "0 6 * * 1" ? "Seg 6h" :
                 job.schedule === "0 7 * * 1,3,5" ? "Seg/Qua/Sex 7h" :
                 job.schedule === "0 8 1 * *" ? "Dia 1 às 8h" :
                 job.schedule === "daily" ? "Diário" :
                 job.schedule}
              </span>
            )}
            {job.lastRunAt && (
              <span className={cn("flex items-center gap-1",
                job.lastRunStatus === "SUCCESS" ? "text-emerald-600" :
                job.lastRunStatus === "FAILED" ? "text-red-500" : "text-muted-foreground")}>
                {job.lastRunStatus === "SUCCESS" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {formatDate(job.lastRunAt)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowLogs(v => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              {showLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Resultados
            </button>
            <button
              onClick={() => runJob.mutate({ id: job.id })}
              disabled={runJob.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {runJob.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              {runJob.isPending ? "Buscando..." : "Executar"}
            </button>
          </div>
        </div>
        {showLogs && <LogPanel jobId={job.id} jobType={job.type} autoExpandLatest={autoExpand} />}
      </div>
      {editing && (
        <JobModal
          initial={{ id: job.id, name: job.name, type: job.type as JobType, schedule: job.schedule, config: job.config }}
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
          <p className="text-muted-foreground text-sm mt-0.5">Agentes de captura automática de editais e monitoramento</p>
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

      {/* Portals status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {PORTAL_OPTIONS.map(p => (
          <div key={p.id} className={cn("rounded-xl border p-3 flex items-center gap-2.5",
            p.available ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800" :
            "border-border bg-muted/30")}>
            <div className={cn("w-2 h-2 rounded-full flex-shrink-0", p.available ? "bg-emerald-500" : "bg-muted-foreground/40")} />
            <div>
              <p className="text-xs font-semibold text-foreground">{p.label}</p>
              <p className="text-[10px] text-muted-foreground">{p.available ? "API disponível" : "Em breve"}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Jobs */}
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
