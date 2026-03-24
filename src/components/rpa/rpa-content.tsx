"use client";

import { trpc } from "@/lib/trpc";
import { Bot, Clock, CheckCircle2, XCircle, AlertTriangle, Play, Pause, RefreshCw } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

export function RpaContent() {
  const { data: jobs, isLoading, refetch } = trpc.rpa.listJobs.useQuery();

  const JOB_TYPE_LABELS: Record<string, string> = {
    EDITAL_SEARCH: "Busca de Editais",
    DOCUMENT_CHECK: "Verificação de Documentos",
    PRICE_UPDATE: "Atualização de Preços",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Automações RPA</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Robôs de captura e análise automática de editais</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <Bot className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-primary">Módulo RPA em modo de configuração</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Os robôs de busca requerem configuração de credenciais dos portais (ComprasGov, BLL, etc).
            Configure as integrações em <span className="text-primary font-medium">Configurações → Integrações</span>.
          </p>
        </div>
      </div>

      {/* Jobs */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      ) : !jobs || jobs.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center text-muted-foreground">
          <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-foreground">Nenhuma automação configurada</p>
          <p className="text-sm mt-1">Configure as integrações para começar a capturar editais automaticamente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", job.isActive ? "bg-green-100" : "bg-slate-100")}>
                    <Bot className={cn("w-5 h-5", job.isActive ? "text-green-600" : "text-slate-400")} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{job.name}</p>
                    <p className="text-xs text-muted-foreground">{JOB_TYPE_LABELS[job.type] ?? job.type}</p>
                  </div>
                </div>
                <span className={cn("status-badge text-xs", job.isActive ? "bg-green-100 text-green-700 border-green-200" : "bg-slate-100 text-slate-500 border-slate-200")}>
                  {job.isActive ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                {job.schedule && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.schedule}</span>}
                {job.lastRunAt && <span>Última execução: {formatDate(job.lastRunAt)}</span>}
                {job.lastRunStatus && (
                  <span className={cn("flex items-center gap-1",
                    job.lastRunStatus === "SUCCESS" ? "text-green-600" :
                    job.lastRunStatus === "FAILED" ? "text-red-600" : "text-amber-600"
                  )}>
                    {job.lastRunStatus === "SUCCESS" ? <CheckCircle2 className="w-3 h-3" /> :
                     job.lastRunStatus === "FAILED" ? <XCircle className="w-3 h-3" /> :
                     <AlertTriangle className="w-3 h-3" />}
                    {job.lastRunStatus}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
