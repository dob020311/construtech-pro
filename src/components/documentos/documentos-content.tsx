"use client";

import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { FileText, AlertTriangle, XCircle, Clock, CheckCircle, Search, X, Upload, Plus, File, Loader2 } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { DocumentType, DocumentStatus } from "@prisma/client";
import { toast } from "sonner";

const TYPE_LABELS: Record<string, string> = {
  CERTIDAO_NEGATIVA: "Certidão Negativa", ATESTADO_CAPACIDADE: "Atestado de Capacidade",
  BALANCO_PATRIMONIAL: "Balanço Patrimonial", CONTRATO_SOCIAL: "Contrato Social",
  PROCURACAO: "Procuração", ALVARA: "Alvará", REGISTRO_CREA: "Registro CREA",
  CERTIDAO_FGTS: "Certidão FGTS", CERTIDAO_INSS: "Certidão INSS",
  CERTIDAO_TRABALHISTA: "Certidão Trabalhista", CERTIDAO_FEDERAL: "Certidão Federal",
  CERTIDAO_ESTADUAL: "Certidão Estadual", CERTIDAO_MUNICIPAL: "Certidão Municipal",
  OUTROS: "Outros",
};
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  VALID: { label: "Válido", color: "bg-green-100 text-green-700 border-green-200", icon: <CheckCircle className="w-3 h-3" /> },
  EXPIRING: { label: "Vencendo", color: "bg-amber-100 text-amber-700 border-amber-200", icon: <Clock className="w-3 h-3" /> },
  EXPIRED: { label: "Vencido", color: "bg-red-100 text-red-700 border-red-200", icon: <XCircle className="w-3 h-3" /> },
  PENDING: { label: "Pendente", color: "bg-slate-100 text-slate-600 border-slate-200", icon: <AlertTriangle className="w-3 h-3" /> },
};

export function DocumentosContent() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<DocumentStatus | "">("");
  const [page, setPage] = useState(1);
  const [showUpload, setShowUpload] = useState(false);

  const { data: stats } = trpc.documento.getDocumentStats.useQuery();
  const { data, isLoading, refetch } = trpc.documento.list.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: filterStatus || undefined,
  });

  const utils = trpc.useUtils();
  const { mutate: deleteDoc } = trpc.documento.delete.useMutation({
    onSuccess: () => { utils.documento.list.invalidate(); utils.documento.getDocumentStats.invalidate(); toast.success("Documento removido"); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Documentos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Repositório central de documentos da empresa</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Documento
        </button>
      </div>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false);
            utils.documento.list.invalidate();
            utils.documento.getDocumentStats.invalidate();
          }}
        />
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Válidos", value: stats.valid, color: "text-green-600", bg: "bg-green-50 border-green-200" },
            { label: "Vencendo (30d)", value: stats.expiring, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
            { label: "Vencidos", value: stats.expired, color: "text-red-600", bg: "bg-red-50 border-red-200" },
            { label: "Pendentes", value: stats.pending, color: "text-slate-600", bg: "bg-slate-50 border-slate-200" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={cn("border rounded-xl p-4", bg)}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={cn("font-heading font-bold text-2xl mt-1", color)}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar documentos..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5 text-muted-foreground" /></button>}
        </div>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value as DocumentStatus | ""); setPage(1); }}
          className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_CONFIG).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide"
          style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1fr 100px 40px" }}>
          {["Nome", "Tipo", "Validade", "Status", "Categoria", ""].map((h) => (
            <div key={h} className="px-4 py-3">{h}</div>
          ))}
        </div>

        {isLoading ? (
          <div className="divide-y divide-border">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="grid items-center px-4 py-3 animate-pulse" style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1fr 100px 40px" }}>
                {[1,2,3,4,5,6].map(j => <div key={j} className="skeleton h-4 rounded" />)}
              </div>
            ))}
          </div>
        ) : data?.items.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-foreground text-sm">Nenhum documento encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data?.items.map((doc) => {
              const st = STATUS_CONFIG[doc.status];
              return (
                <div key={doc.id} className="grid items-center hover:bg-accent/30 transition-colors"
                  style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1fr 100px 40px" }}>
                  <div className="px-4 py-3">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                  </div>
                  <div className="px-4 py-3 text-sm text-muted-foreground">{TYPE_LABELS[doc.type] ?? doc.type}</div>
                  <div className={cn("px-4 py-3 text-sm", doc.status === "EXPIRED" ? "text-red-600 font-medium" : doc.status === "EXPIRING" ? "text-amber-600 font-medium" : "text-muted-foreground")}>
                    {doc.expirationDate ? formatDate(doc.expirationDate) : "—"}
                  </div>
                  <div className="px-4 py-3">
                    <span className={cn("status-badge text-xs flex items-center gap-1 w-fit", st.color)}>
                      {st.icon} {st.label}
                    </span>
                  </div>
                  <div className="px-4 py-3 text-xs text-muted-foreground">{doc.category ?? "—"}</div>
                  <div className="px-2 py-3">
                    <button onClick={() => { if (confirm("Remover documento?")) deleteDoc({ id: doc.id }); }}
                      className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">{data.total} documentos</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors">Anterior</button>
            <span className="px-3 py-1.5 text-muted-foreground">{page} / {data.pages}</span>
            <button disabled={page === data.pages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors">Próximo</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Upload Modal ─────────────────────────────────────────────── */
const DOC_TYPES = Object.entries({
  CERTIDAO_FEDERAL: "Certidão Federal",
  CERTIDAO_ESTADUAL: "Certidão Estadual",
  CERTIDAO_MUNICIPAL: "Certidão Municipal",
  CERTIDAO_TRABALHISTA: "Certidão Trabalhista",
  CERTIDAO_FGTS: "Certidão FGTS",
  CERTIDAO_INSS: "Certidão INSS",
  CERTIDAO_NEGATIVA: "Certidão Negativa",
  ATESTADO_CAPACIDADE: "Atestado de Capacidade",
  REGISTRO_CREA: "Registro CREA",
  BALANCO_PATRIMONIAL: "Balanço Patrimonial",
  CONTRATO_SOCIAL: "Contrato Social",
  PROCURACAO: "Procuração",
  ALVARA: "Alvará",
  OUTROS: "Outros",
});

function UploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<DocumentType>("OUTROS" as DocumentType);
  const [category, setCategory] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { mutate: createDoc } = trpc.documento.create.useMutation({
    onSuccess,
    onError: (e) => { toast.error(e.message); setUploading(false); },
  });

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); if (!name) setName(f.name.replace(/\.[^.]+$/, "")); }
  }, [name]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); if (!name) setName(f.name.replace(/\.[^.]+$/, "")); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error("Selecione um arquivo"); return; }
    if (!name.trim()) { toast.error("Informe o nome do documento"); return; }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? "Erro no upload"); }
      const { fileKey, fileSize, mimeType } = await res.json();

      createDoc({
        name: name.trim(),
        type,
        category: category.trim() || undefined,
        fileKey,
        fileSize,
        mimeType,
        expirationDate: expirationDate ? new Date(expirationDate) : undefined,
      });
      toast.success("Documento enviado com sucesso");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro no upload");
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Upload className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-heading font-semibold text-foreground">Novo Documento</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
              dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30",
              file && "border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10"
            )}
          >
            <input ref={inputRef} type="file" className="hidden" onChange={onFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx" />
            {file ? (
              <div className="flex items-center gap-3 justify-center">
                <File className="w-8 h-8 text-emerald-500 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground truncate max-w-[260px]">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="ml-auto p-1 rounded text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Arraste o arquivo ou clique para selecionar</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, Word, Excel, imagens — máx. 10 MB</p>
              </>
            )}
          </div>

          {/* Nome */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nome do Documento *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Certidão Negativa Federal"
              className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Tipo */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tipo *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DocumentType)}
                className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {DOC_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>

            {/* Validade */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Validade</label>
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Categoria / Licitação (opcional)</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: Habilitação, PE 042/2024..."
              className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</> : <><Upload className="w-4 h-4" />Enviar Documento</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
