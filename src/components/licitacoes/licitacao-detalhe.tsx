"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import Link from "next/link";
import {
  ArrowLeft, Calendar, Building2, FileText, DollarSign, Tag,
  Clock, CheckCircle2, XCircle, Edit2, ExternalLink, User, Activity,
  Upload, Cpu, AlertTriangle, ChevronDown, ChevronRight, Loader2,
  FileCheck, Star, Shield, Wrench, Wallet, ClipboardList, Package,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { LicitacaoStatus } from "@prisma/client";

function relativeTime(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins} min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d atrás`;
  return new Date(date).toLocaleDateString("pt-BR");
}

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

interface DocItem { nome: string; obrigatorio: boolean; observacao?: string; }
interface DocCategoria { categoria: string; descricao?: string; itens: DocItem[]; }
interface Prazo { nome: string; data: string; descricao?: string; }
interface EditalAnalysis {
  resumo: string; objeto?: string; orgao?: string; modalidade?: string;
  valorEstimado?: number; criterioJulgamento?: string;
  prazos: Prazo[]; documentos: DocCategoria[];
  requisitosEspecificos: string[]; pontosCriticos: string[]; pontuacao?: number;
}

const CAT_ICONS: Record<string, React.ReactNode> = {
  "Habilitação Jurídica": <Shield className="w-4 h-4" />,
  "Regularidade Fiscal e Trabalhista": <FileCheck className="w-4 h-4" />,
  "Qualificação Técnica": <Wrench className="w-4 h-4" />,
  "Qualificação Econômico-Financeira": <Wallet className="w-4 h-4" />,
  "Declarações e Formulários": <ClipboardList className="w-4 h-4" />,
  "Proposta Comercial": <Package className="w-4 h-4" />,
};

export function LicitacaoDetalhe({ id }: { id: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "orcamentos" | "atividades" | "analise">("overview");
  const [changingStatus, setChangingStatus] = useState(false);

  // Edital analysis state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<EditalAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === "application/pdf" || file.name.endsWith(".pdf"))) {
      setSelectedFile(file);
      setAnalysisError(null);
    } else {
      toast.error("Apenas arquivos PDF são suportados");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setSelectedFile(file); setAnalysisError(null); }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("licitacaoId", id);

    try {
      const res = await fetch("/api/licitacao/analyze-edital", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao analisar edital");
      setAnalysisResult(json.analysis as EditalAnalysis);
      // Open first category by default
      if (json.analysis?.documentos?.[0]?.categoria) {
        setOpenCategories({ [json.analysis.documentos[0].categoria]: true });
      }
      refetch();
      toast.success("Edital analisado com sucesso!");
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleCategory = (cat: string) =>
    setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));

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
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {(["overview", "orcamentos", "atividades", "analise"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5",
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}>
              {tab === "overview" ? "Visão Geral"
                : tab === "orcamentos" ? "Orçamentos"
                : tab === "atividades" ? "Atividades"
                : <><Cpu className="w-3.5 h-3.5" />Análise IA</>}
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
                  {licitacao.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-2 text-sm">
                      <div className={cn("w-2 h-2 rounded-full flex-shrink-0",
                        doc.status === "APPROVED" ? "bg-green-500" :
                        doc.status === "UPLOADED" ? "bg-blue-500" :
                        doc.status === "REJECTED" ? "bg-red-500" : "bg-amber-400"
                      )} />
                      <span className="truncate text-muted-foreground">{doc.requiredName}</span>
                    </div>
                  ))}
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

      {activeTab === "analise" && (
        <div className="space-y-5">
          {/* Upload area */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-heading font-semibold text-sm mb-1 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />Análise Automática de Edital
            </h3>
            <p className="text-xs text-muted-foreground mb-4">Envie o PDF do edital e a IA identificará todos os documentos exigidos, prazos e pontos críticos.</p>

            {/* Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40"
              )}>
              <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFileSelect} />
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              {selectedFile ? (
                <div>
                  <p className="font-medium text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB · clique para trocar</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium">Arraste o PDF do edital ou clique para selecionar</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Apenas PDF · máx 20 MB</p>
                </div>
              )}
            </div>

            {analysisError && (
              <div className="mt-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/10 border border-red-200 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{analysisError}</span>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!selectedFile || isAnalyzing}
              className={cn(
                "mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                selectedFile && !isAnalyzing
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}>
              {isAnalyzing ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Analisando edital... pode levar até 60s</>
              ) : (
                <><Cpu className="w-4 h-4" />Analisar Edital com IA</>
              )}
            </button>
          </div>

          {/* Existing saved analysis notice */}
          {!analysisResult && licitacao.aiSummary && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm">
              <p className="font-medium text-primary flex items-center gap-1.5 mb-1"><Cpu className="w-3.5 h-3.5" />Análise anterior disponível</p>
              <p className="text-muted-foreground">{licitacao.aiSummary}</p>
              {licitacao.aiScore && (
                <span className="inline-flex items-center gap-1 mt-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  <Star className="w-3 h-3" />Score {(licitacao.aiScore * 100).toFixed(0)}%
                </span>
              )}
            </div>
          )}

          {/* Analysis results */}
          {analysisResult && (
            <div className="space-y-4">
              {/* Summary + score */}
              <div className="bg-card border border-primary/20 rounded-xl p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-heading font-semibold text-sm text-primary flex items-center gap-2">
                    <Cpu className="w-4 h-4" />Resumo Executivo
                  </h3>
                  {analysisResult.pontuacao !== undefined && (
                    <span className={cn(
                      "inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0",
                      analysisResult.pontuacao >= 70 ? "bg-green-100 text-green-700" :
                      analysisResult.pontuacao >= 40 ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    )}>
                      <Star className="w-3 h-3" />Score {analysisResult.pontuacao}/100
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{analysisResult.resumo}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  {analysisResult.orgao && <div><span className="text-muted-foreground">Órgão: </span><span className="font-medium">{analysisResult.orgao}</span></div>}
                  {analysisResult.modalidade && <div><span className="text-muted-foreground">Modalidade: </span><span className="font-medium">{analysisResult.modalidade}</span></div>}
                  {analysisResult.criterioJulgamento && <div><span className="text-muted-foreground">Critério: </span><span className="font-medium">{analysisResult.criterioJulgamento}</span></div>}
                  {analysisResult.valorEstimado ? <div><span className="text-muted-foreground">Valor: </span><span className="font-medium">{formatCurrency(analysisResult.valorEstimado)}</span></div> : null}
                </div>
              </div>

              {/* Prazos */}
              {analysisResult.prazos?.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2"><Calendar className="w-4 h-4" />Prazos</h3>
                  <div className="space-y-2">
                    {analysisResult.prazos.map((p, i) => (
                      <div key={i} className="flex items-start justify-between gap-2 text-sm py-1.5 border-b border-border last:border-0">
                        <div>
                          <p className="font-medium">{p.nome}</p>
                          {p.descricao && <p className="text-xs text-muted-foreground mt-0.5">{p.descricao}</p>}
                        </div>
                        <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded flex-shrink-0">{p.data}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents by category */}
              {analysisResult.documentos?.length > 0 && (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                    <h3 className="font-heading font-semibold text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Documentos Exigidos
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {analysisResult.documentos.reduce((s, c) => s + c.itens.length, 0)} documentos · {analysisResult.documentos.length} categorias
                    </span>
                  </div>
                  <div className="divide-y divide-border">
                    {analysisResult.documentos.map((cat) => (
                      <div key={cat.categoria}>
                        <button
                          onClick={() => toggleCategory(cat.categoria)}
                          className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors text-left">
                          <div className="flex items-center gap-2.5">
                            <span className="text-muted-foreground">{CAT_ICONS[cat.categoria] ?? <FileText className="w-4 h-4" />}</span>
                            <div>
                              <p className="text-sm font-medium">{cat.categoria}</p>
                              {cat.descricao && <p className="text-xs text-muted-foreground">{cat.descricao}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{cat.itens.length}</span>
                            {openCategories[cat.categoria]
                              ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                          </div>
                        </button>
                        {openCategories[cat.categoria] && cat.itens.length > 0 && (
                          <div className="px-5 pb-3 space-y-1.5 bg-muted/20">
                            {cat.itens.map((item, i) => (
                              <div key={i} className="flex items-start gap-2.5 py-1.5">
                                <div className={cn("w-2 h-2 rounded-full flex-shrink-0 mt-1.5", item.obrigatorio ? "bg-red-400" : "bg-amber-400")} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm">{item.nome}</p>
                                  {item.observacao && <p className="text-xs text-muted-foreground mt-0.5">{item.observacao}</p>}
                                </div>
                                <span className={cn("text-xs px-1.5 py-0.5 rounded flex-shrink-0", item.obrigatorio ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600")}>
                                  {item.obrigatorio ? "Obrigatório" : "Opcional"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Requisitos específicos */}
              {analysisResult.requisitosEspecificos?.length > 0 && (
                <div className="bg-card border border-amber-200 rounded-xl p-5">
                  <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2 text-amber-700">
                    <Star className="w-4 h-4" />Requisitos Específicos
                  </h3>
                  <ul className="space-y-1.5">
                    {analysisResult.requisitosEspecificos.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <ChevronRight className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pontos críticos */}
              {analysisResult.pontosCriticos?.length > 0 && (
                <div className="bg-card border border-red-200 rounded-xl p-5">
                  <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-4 h-4" />Pontos Críticos
                  </h3>
                  <ul className="space-y-1.5">
                    {analysisResult.pontosCriticos.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
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
                    <p className="text-xs text-muted-foreground mt-1">
                      {act.user.name} · <span title={formatDate(act.createdAt)}>{relativeTime(act.createdAt)}</span>
                    </p>
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
