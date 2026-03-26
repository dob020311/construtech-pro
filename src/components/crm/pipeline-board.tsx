"use client";

import { trpc } from "@/lib/trpc";
import { cn, formatCurrency, formatDate, STATUS_COLORS, STATUS_LABELS } from "@/lib/utils";
import { Building2, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";
import { PipelineStage } from "@prisma/client";
import { toast } from "sonner";

const STAGE_LABELS: Record<PipelineStage, string> = {
  PROSPECTING: "Prospecção",
  ANALYSIS: "Análise",
  DECISION: "Decisão",
  BUDGETING: "Orçamento",
  PROPOSAL: "Proposta",
  RESULT: "Resultado",
};

const STAGE_COLORS: Record<PipelineStage, string> = {
  PROSPECTING: "bg-slate-50 border-slate-200 dark:bg-slate-900/20",
  ANALYSIS: "bg-blue-50 border-blue-200 dark:bg-blue-900/20",
  DECISION: "bg-amber-50 border-amber-200 dark:bg-amber-900/20",
  BUDGETING: "bg-orange-50 border-orange-200 dark:bg-orange-900/20",
  PROPOSAL: "bg-purple-50 border-purple-200 dark:bg-purple-900/20",
  RESULT: "bg-green-50 border-green-200 dark:bg-green-900/20",
};

const STAGE_HEADER_COLORS: Record<PipelineStage, string> = {
  PROSPECTING: "text-slate-600",
  ANALYSIS: "text-blue-600",
  DECISION: "text-amber-600",
  BUDGETING: "text-orange-600",
  PROPOSAL: "text-purple-600",
  RESULT: "text-green-600",
};

const STAGES: PipelineStage[] = ["PROSPECTING", "ANALYSIS", "DECISION", "BUDGETING", "PROPOSAL", "RESULT"];

export function PipelineBoard() {
  const { data: pipeline, isLoading } = trpc.crm.getPipeline.useQuery();
  const utils = trpc.useUtils();

  const { mutate: moveEntry } = trpc.crm.movePipelineEntry.useMutation({
    onSuccess: () => utils.crm.getPipeline.invalidate(),
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-40 rounded" />
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-72">
              <div className="skeleton h-8 w-full rounded-lg mb-3" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="skeleton h-32 w-full rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalPipelineValue = STAGES.flatMap((stage) =>
    (pipeline?.[stage] ?? []).map((e) => Number(e.value ?? e.licitacao.estimatedValue ?? 0))
  ).reduce((sum, v) => sum + v, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Pipeline CRM</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Pipeline total: {formatCurrency(totalPipelineValue)}
          </p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6">
        {STAGES.map((stage) => {
          const entries = pipeline?.[stage] ?? [];
          const stageValue = entries.reduce(
            (sum, e) => sum + Number(e.value ?? e.licitacao.estimatedValue ?? 0),
            0
          );

          return (
            <div key={stage} className="flex-shrink-0 w-72">
              {/* Column header */}
              <div className={cn("rounded-xl border px-3 py-2.5 mb-3", STAGE_COLORS[stage])}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className={cn("font-heading font-semibold text-sm", STAGE_HEADER_COLORS[stage])}>
                      {STAGE_LABELS[stage]}
                    </h3>
                    <span className="bg-white/80 dark:bg-black/20 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {entries.length}
                    </span>
                  </div>
                  {stageValue > 0 && (
                    <span className="text-xs font-mono font-medium text-muted-foreground">
                      {formatCurrency(stageValue)}
                    </span>
                  )}
                </div>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-card border border-border rounded-xl p-3.5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Link
                        href={`/licitacoes/${entry.licitacao.id}`}
                        className="text-sm font-medium leading-tight hover:text-primary transition-colors line-clamp-2"
                      >
                        {entry.licitacao.object}
                      </Link>
                    </div>

                    <p className="text-xs font-mono text-primary mb-2">{entry.licitacao.number}</p>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                      <Building2 className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{entry.licitacao.organ}</span>
                    </div>

                    {entry.licitacao.closingDate && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(entry.licitacao.closingDate)}</span>
                      </div>
                    )}

                    {entry.licitacao.estimatedValue && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold mb-3">
                        <DollarSign className="w-3 h-3 text-muted-foreground" />
                        <span className="font-mono">{formatCurrency(Number(entry.licitacao.estimatedValue))}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className={cn("status-badge text-[10px]", STATUS_COLORS[entry.licitacao.status])}>
                        {STATUS_LABELS[entry.licitacao.status]}
                      </span>

                      {entry.probability !== null && (
                        <div className="flex items-center gap-1">
                          <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${entry.probability}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{entry.probability}%</span>
                        </div>
                      )}
                    </div>

                    {/* Move to next stage */}
                    {stage !== "RESULT" && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <select
                          onChange={(e) => {
                            const target = e.target;
                            const value = target.value;
                            if (value) {
                              moveEntry(
                                { licitacaoId: entry.licitacao.id, stage: value as PipelineStage },
                                { onSettled: () => { target.value = ""; } }
                              );
                            }
                          }}
                          className="w-full text-[11px] px-2 py-1 rounded border border-border bg-background text-muted-foreground focus:outline-none"
                          defaultValue=""
                        >
                          <option value="" disabled>Mover para...</option>
                          {STAGES.filter((s) => s !== stage).map((s) => (
                            <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}

                {entries.length === 0 && (
                  <div className="border-2 border-dashed border-border rounded-xl py-6 text-center text-muted-foreground text-xs">
                    Sem licitações
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
