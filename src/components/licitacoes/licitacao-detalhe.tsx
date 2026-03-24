"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import Link from "next/link";
import {
  ArrowLeft, Calendar, Building2, FileText, DollarSign, Tag,
  Clock, CheckCircle2, XCircle, Edit2, ExternalLink, User, Activity
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { LicitacaoStatus } from "@prisma/client";

const STATUS_LABELS: Record<string, string> = {
  IDENTIFIED: "Identificada", ANALYZING: "Analisando", GO: "GO", NO_GO: "NO-GO",
  BUDGETING: "Orçando", PROPOSAL_SENT: "Proposta Enviada", WON: "Ganhou",
  LOST: "Perdeu", CANCELED: "Cancelada",
};
const STATUS_COLORS: Record<string, string> = {
  IDENTIFIED: "bg-slate-100 text-slate-600 border-slate-300",
  ANALYZING: "bg-blue-100 text-blue-700 border-blue-300",
  GO: "bg-green-100 text-green-700 border-green-300",
  NO_GO: "bg-red-100 text-red-700 border-red-300",
  BUDGETING: "bg-amber-100 text-amber-700 border-amber-300",
  PROPOSAL_SENT: "bg-purple-100 text-purple-700 border-purple-300",
  WON: "bg-emerald-100 text-emerald-700 border-emerald-300",
  LOST: "bg-red-100 text-red-800 border-red-300",
  CANCELED: "bg-gray-100 text-gray-600 border-gray-300",
};
const MODALITY_LABELS: Record<string, string> = {
  PREGAO_ELETRONICO: "Pregão Eletrônico", PREGAO_PRESENCIAL: "Pregão Presencial",
  CONCORRENCIA: "Concorrência", TOMADA_PRECOS: "Tomada de Preços",
  CONVITE: "Convite", CONCURSO: "Concurso",
  DIALOGO_COMPETITIVO: "Diálogo Competitivo", RDC: "RDC",
};
const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  NOTE: <FileText className="w-3.5 h-3.5" />,
  TASK: <CheckCircle2 className="w-3.5 h-3.5" />,
  STATUS_CHANGE: <Tag className="w-3.5 h-3.5" />,
  DOCUMENT_UPLOAD: <FileText className="w-3.5 h-3.5" />,
  SYSTEM: <Activity className="w-3.5 h-3.5" />,
};

const STATUS_OPTIONS = Object.entries(STATUS_LABELS) as [LicitacaoStatus, string][];

export function LicitacaoDetalhe({ id }: { id: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "orcamentos" | "atividades">("overview");
  const [changingStatus, setChangingStatus] = useState(false);

  const { data: licitacao, isLoading, refetch } = trpc.licitacao.getById.useQuery({ id });
  const utils = trpc.useUtils();

  const { mutate: updateStatus, isPending: isUpdatingStatus } = trpc.licitacao.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      utils.licitacao.list.invalidate();
      setChangingStatus(false);
      toast.success("Status atualizado");
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="skeleton h-8 w-64 rounded" />
        <div className="skeleton h-4 w-96 rounded" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  if (!licitacao) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <XCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Licitação não encontrada</p>
        <Link href="/licitacoes" className="text-primary text-sm mt-2 inline-block">← Voltar</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <Link href="/licitacoes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Licitações
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-sm text-muted-foreground">{licitacao.number}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground">{MODALITY_LABELS[licitacao.modality] ?? licitacao.modality}</span>
            </div>
            <h1 className="text-xl font-heading font-bold leading-snug">{licitacao.object}</h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 flex-shrink-0" /> {licitacao.organ}
              {licitacao.city && <><span>·</span>{licitacao.city}/{licitacao.state}</>}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {changingStatus ? (
              <div className="flex items-center gap-2">
                <select
                  defaultValue={licitacao.status}
                  onChange={(e) => updateStatus({ id, status: e.target.value as LicitacaoStatus })}
                  disabled={isUpdatingStatus}
                  className="text-sm px-2 py-1.5 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {STATUS_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <button onClick={() => setChangingStatus(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancelar</button>
              </div>
            ) : (
              <button
                onClick={() => setChangingStatus(true)}
                className={cn("status-badge text-xs cursor-pointer hover:opacity-80 transition-opacity", STATUS_COLORS[licitacao.status])}
              >
                {STATUS_LABELS[licitacao.status]}
                <Edit2 className="w-2.5 h-2.5 ml-1.5" />
              </button>
            )}
            {licitacao.portalUrl && (
              <a href={licitacao.portalUrl} target="_blank" rel="noopener noreferrer"
                className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground">
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" />Valor Estimado</p>
          <p className="font-heading font-bold text-base mt-1">
            {licitacao.estimatedValue ? formatCurrency(Number(licitacao.estimatedValue)) : "—"}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Abertura</p>
          <p className="font-heading font-bold text-base mt-1">{licitacao.openingDate ? formatDate(licitacao.openingDate) : "—"}</p>
        </div>
        <div className={cn("bg-card border rounded-xl p-4", licitacao.closingDate && new Date(licitacao.closingDate) < new Date() ? "border-red-300 bg-red-50 dark:bg-red-900/10" : "border-border")}>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Encerramento</p>
          <p className={cn("font-heading font-bold text-base mt-1", licitacao.closingDate && new Date(licitacao.closingDate) < new Date() ? "text-red-600" : "")}>
            {licitacao.closingDate ? formatDate(licitacao.closingDate) : "—"}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />Documentos</p>
          <p className="font-heading font-bold text-base mt-1">{licitacao.documents.length} exigidos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-1 -mb-px">
          {(["overview", "orcamentos", "atividades"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize",
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}>
              {tab === "overview" ? "Visão Geral" : tab === "orcamentos" ? "Orçamentos" : "Atividades"}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            {/* Objeto completo */}
            {licitacao.fullObject && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-heading font-semibold text-sm mb-2">Objeto Completo</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{licitacao.fullObject}</p>
              </div>
            )}

            {/* Equipe */}
            {licitacao.assignments.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2"><User className="w-4 h-4" />Equipe Responsável</h3>
                <div className="space-y-2">
                  {licitacao.assignments.map((a) => (
                    <div key={a.id} className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {a.user.name.charAt(0)}
                      </div>
                      <span className="text-sm">{a.user.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resumo IA */}
            {licitacao.aiSummary && (
              <div className="bg-card border border-primary/20 rounded-xl p-5">
                <h3 className="font-heading font-semibold text-sm mb-2 text-primary">Resumo IA</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{licitacao.aiSummary}</p>
                {licitacao.aiScore && (
                  <p className="text-xs text-muted-foreground mt-2">Score de relevância: <span className="font-bold text-primary">{(licitacao.aiScore * 100).toFixed(0)}%</span></p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Dados gerais */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h3 className="font-heading font-semibold text-sm">Dados Gerais</h3>
              {[
                { label: "Segmento", value: licitacao.segment },
                { label: "Critério", value: licitacao.judgmentCriteria },
                { label: "Estado", value: licitacao.state },
                { label: "Cidade", value: licitacao.city },
              ].filter(r => r.value).map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-right">{value}</span>
                </div>
              ))}
            </div>

            {/* Docs exigidos */}
            {licitacao.documents.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-heading font-semibold text-sm mb-3">Documentos Exigidos</h3>
                <div className="space-y-1.5">
                  {licitacao.documents.slice(0, 8).map((doc) => (
                    <div key={doc.id} className="flex items-center gap-2 text-sm">
                      <div className={cn("w-2 h-2 rounded-full flex-shrink-0",
                        doc.status === "APPROVED" ? "bg-green-500" :
                        doc.status === "UPLOADED" ? "bg-blue-500" :
                        doc.status === "REJECTED" ? "bg-red-500" : "bg-amber-400"
                      )} />
                      <span className="truncate text-muted-foreground">{doc.requiredName}</span>
                    </div>
                  ))}
                  {licitacao.documents.length > 8 && (
                    <p className="text-xs text-muted-foreground">+{licitacao.documents.length - 8} mais</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "orcamentos" && (
        <div className="space-y-3">
          {licitacao.orcamentos.length === 0 ? (
            <div className="bg-card border border-border rounded-xl py-16 text-center text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-foreground text-sm">Nenhum orçamento vinculado</p>
              <Link href="/orcamentos" className="text-primary text-sm mt-2 inline-block hover:underline">Criar orçamento →</Link>
            </div>
          ) : (
            licitacao.orcamentos.map((orc) => (
              <Link key={orc.id} href={`/orcamentos/${orc.id}`}
                className="flex items-center justify-between bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all">
                <div>
                  <p className="font-medium text-sm">{orc.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">v{orc.version} · {orc.status}</p>
                </div>
                <div className="text-right">
                  <p className="font-heading font-bold text-primary">{formatCurrency(Number(orc.totalWithBdi))}</p>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto mt-0.5" />
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {activeTab === "atividades" && (
        <div className="space-y-2">
          {licitacao.activities.length === 0 ? (
            <div className="bg-card border border-border rounded-xl py-16 text-center text-muted-foreground">
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-foreground text-sm">Nenhuma atividade registrada</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl divide-y divide-border">
              {licitacao.activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground mt-0.5">
                    {ACTIVITY_ICONS[act.type] ?? <Activity className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{act.title}</p>
                    {act.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{act.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{act.user.name} · {formatDate(act.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
