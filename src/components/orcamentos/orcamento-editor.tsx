"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import {
  Plus, Trash2, ChevronDown, ChevronRight, Settings, BarChart3,
  Download, Loader2, X, FileSpreadsheet, FileText, Sparkles, Send,
  Cpu, Package, HardHat, Wrench, ChevronLeft,
  Upload, Mic, MicOff, MessageSquare, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface OrcamentoEditorProps { id: string; }

interface OrcItem { id: string; code: string; description: string; unit: string; quantity: unknown; unitPrice: unknown; totalPrice: unknown; source: string | null; order: number; }
interface OrcChapter { id: string; code: string; name: string; order: number; items: OrcItem[]; }
interface OrcamentoData {
  id: string; name: string; bdiPercentage: unknown; totalValue: unknown; totalWithBdi: unknown;
  licitacao: { id: string; number: string; object: string; organ: string } | null;
  chapters: OrcChapter[];
}

export function OrcamentoEditor({ id }: OrcamentoEditorProps) {
  const router = useRouter();
  const [expandedChapters, setExpandedChapters] = useState<string[]>([]);
  const [showBdiModal, setShowBdiModal] = useState(false);
  const [showCurvaAbc, setShowCurvaAbc] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [addItemChapterId, setAddItemChapterId] = useState<string | null>(null);
  const [aiCompositionChapterId, setAiCompositionChapterId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAiCommand, setShowAiCommand] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const res = await fetch("/api/orcamento/export-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orcamentoId: id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erro ao exportar");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      a.download = match?.[1] ?? "Orcamento.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Excel exportado!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao exportar Excel");
    } finally {
      setIsExportingExcel(false);
    }
  };
  const utils = trpc.useUtils();

  const deleteOrcamento = trpc.orcamento.delete.useMutation({
    onSuccess: () => { toast.success("Orçamento excluído"); router.push("/orcamentos"); },
    onError: (err) => toast.error(err.message),
  });

  const { data: orcamento, isLoading } = trpc.orcamento.getById.useQuery({ id });

  const { mutate: updateItem, isPending: isUpdating } = trpc.orcamento.updateItem.useMutation({
    onSuccess: () => utils.orcamento.getById.invalidate({ id }),
    onError: (err) => toast.error(err.message),
  });

  const { mutate: deleteItem } = trpc.orcamento.deleteItem.useMutation({
    onSuccess: () => { utils.orcamento.getById.invalidate({ id }); toast.success("Item removido"); },
  });

  const { mutate: addChapter, isPending: isAddingChapter } = trpc.orcamento.addChapter.useMutation({
    onSuccess: () => { utils.orcamento.getById.invalidate({ id }); setShowAddChapter(false); toast.success("Capítulo adicionado"); },
    onError: (err) => toast.error(err.message),
  });

  const { mutate: addItem, isPending: isAddingItem } = trpc.orcamento.addItem.useMutation({
    onSuccess: () => { utils.orcamento.getById.invalidate({ id }); setAddItemChapterId(null); toast.success("Item adicionado"); },
    onError: (err) => toast.error(err.message),
  });

  const { mutate: updateBdi, isPending: isUpdatingBdi } = trpc.orcamento.updateBdi.useMutation({
    onSuccess: () => { utils.orcamento.getById.invalidate({ id }); setShowBdiModal(false); toast.success("BDI atualizado"); },
    onError: (err) => toast.error(err.message),
  });

  const { data: curvaAbc } = trpc.orcamento.getCurvaAbc.useQuery({ id }, { enabled: showCurvaAbc });

  const { mutate: addItemWithComposition, isPending: isAddingWithAi } = trpc.orcamento.addItemWithComposition.useMutation({
    onSuccess: () => { utils.orcamento.getById.invalidate({ id }); setAiCompositionChapterId(null); toast.success("Item com composição adicionado!"); },
    onError: (err) => toast.error(err.message),
  });

  const { mutate: aiCommand, isPending: isRunningCommand } = trpc.orcamento.aiCommand.useMutation({
    onSuccess: (data) => { utils.orcamento.getById.invalidate({ id }); return data; },
    onError: (err) => toast.error(err.message),
  });

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) =>
      prev.includes(chapterId) ? prev.filter((c) => c !== chapterId) : [...prev, chapterId]
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="skeleton h-8 w-64 rounded" />
        <div className="skeleton h-4 w-40 rounded" />
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="skeleton h-96 w-full rounded" />
        </div>
      </div>
    );
  }

  if (!orcamento) {
    return <div className="text-center py-20 text-muted-foreground">Orçamento não encontrado</div>;
  }

  const totalItems = orcamento.chapters.reduce((sum, ch) => sum + ch.items.length, 0);

  return (
    <div className="space-y-4">
      {/* Modals */}
      {showBdiModal && (
        <BdiModal
          bdiPercentage={Number(orcamento.bdiPercentage)}
          onSave={(bdi) => updateBdi({ id, bdiPercentage: bdi })}
          onClose={() => setShowBdiModal(false)}
          isPending={isUpdatingBdi}
        />
      )}
      {showCurvaAbc && (
        <CurvaAbcModal items={curvaAbc ?? []} onClose={() => setShowCurvaAbc(false)} />
      )}
      {showExport && orcamento && (
        <ExportModal orcamento={orcamento} onClose={() => setShowExport(false)} />
      )}
      {showAddChapter && (
        <AddChapterModal
          nextOrder={orcamento.chapters.length + 1}
          onSave={(code, name) => addChapter({ orcamentoId: id, code, name, order: orcamento.chapters.length + 1 })}
          onClose={() => setShowAddChapter(false)}
          isPending={isAddingChapter}
        />
      )}
      {addItemChapterId && (
        <AddItemModal
          key={addItemChapterId}
          chapterId={addItemChapterId}
          nextOrder={(orcamento.chapters.find(c => c.id === addItemChapterId)?.items.length ?? 0) + 1}
          chapterCode={orcamento.chapters.find(c => c.id === addItemChapterId)?.code ?? ""}
          onSave={(data) => addItem({ ...data, chapterId: addItemChapterId })}
          onClose={() => setAddItemChapterId(null)}
          isPending={isAddingItem}
        />
      )}
      {aiCompositionChapterId && (
        <AiCompositionModal
          chapterId={aiCompositionChapterId}
          onSave={(data) => addItemWithComposition({ ...data, chapterId: aiCompositionChapterId })}
          onClose={() => setAiCompositionChapterId(null)}
          isPending={isAddingWithAi}
        />
      )}
      {showImportModal && (
        <ImportPlanilhaModal
          orcamentoId={id}
          onSuccess={() => { utils.orcamento.getById.invalidate({ id }); setShowImportModal(false); }}
          onClose={() => setShowImportModal(false)}
        />
      )}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-heading font-bold">Excluir orçamento</h2>
                <p className="text-xs text-muted-foreground">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Tem certeza que deseja excluir <span className="font-semibold text-foreground">"{orcamento.name}"</span>?
              Todos os capítulos e itens serão removidos permanentemente.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowDeleteConfirm(false)} disabled={deleteOrcamento.isPending}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">
                Cancelar
              </button>
              <button type="button" onClick={() => deleteOrcamento.mutate({ id })} disabled={deleteOrcamento.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50">
                {deleteOrcamento.isPending ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-heading font-bold">{orcamento.name}</h1>
          {orcamento.licitacao && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {orcamento.licitacao.number} — {orcamento.licitacao.organ}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/30 dark:border-violet-700 dark:text-violet-400 transition-colors">
            <Upload className="w-3.5 h-3.5" /> Importar Planilha
          </button>
          <button onClick={handleExportExcel} disabled={isExportingExcel}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            {isExportingExcel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
            Exportar Excel
          </button>
          <button onClick={() => setShowAiCommand(!showAiCommand)}
            className={cn("flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors",
              showAiCommand ? "border-indigo-400 bg-indigo-600 text-white" : "border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-700 dark:text-indigo-400")}>
            <MessageSquare className="w-3.5 h-3.5" /> Assistente IA
          </button>
          <button onClick={() => setShowExport(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted transition-colors">
            <Download className="w-3.5 h-3.5" /> Exportar / IA
          </button>
          <button onClick={() => setShowBdiModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted transition-colors">
            <Settings className="w-3.5 h-3.5" /> BDI
          </button>
          <button onClick={() => setShowCurvaAbc(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            <BarChart3 className="w-3.5 h-3.5" /> Curva ABC
          </button>
          <button onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-700 dark:text-red-400 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Excluir
          </button>
        </div>
      </div>

      {/* AI Command Bar */}
      {showAiCommand && (
        <AiCommandBar
          orcamentoId={id}
          onCommand={(cmd) => aiCommand({ id, command: cmd })}
          isRunning={isRunningCommand}
        />
      )}

      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total sem BDI", value: formatCurrency(Number(orcamento.totalValue)) },
          { label: `BDI (${Number(orcamento.bdiPercentage).toFixed(1)}%)`, value: formatCurrency(Number(orcamento.totalWithBdi) - Number(orcamento.totalValue)) },
          { label: "Total com BDI", value: formatCurrency(Number(orcamento.totalWithBdi)), highlight: true },
          { label: "Itens", value: `${totalItems} itens em ${orcamento.chapters.length} capítulos` },
        ].map((item) => (
          <div key={item.label} className={cn("bg-card border rounded-lg px-4 py-3", item.highlight ? "border-primary/30 bg-primary/5" : "border-border")}>
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className={cn("font-heading font-bold text-base mt-0.5", item.highlight && "text-primary")}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Spreadsheet */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide"
          style={{ gridTemplateColumns: "2fr 5fr 80px 100px 120px 130px 32px" }}>
          {["Código", "Descrição", "Und", "Quantidade", "Preço Unit.", "Total", ""].map((h) => (
            <div key={h} className="px-3 py-2.5">{h}</div>
          ))}
        </div>

        <div className="divide-y divide-border">
          {orcamento.chapters.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p className="text-sm">Nenhum capítulo criado. Clique em "Adicionar Capítulo" abaixo.</p>
            </div>
          ) : (
            orcamento.chapters.map((chapter) => {
              const isExpanded = expandedChapters.includes(chapter.id);
              const chapterTotal = chapter.items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
              return (
                <div key={chapter.id}>
                  <button onClick={() => toggleChapter(chapter.id)}
                    className="w-full grid items-center bg-muted/30 hover:bg-muted/50 transition-colors"
                    style={{ gridTemplateColumns: "2fr 5fr 80px 100px 120px 130px 32px" }}>
                    <div className="px-3 py-2.5 flex items-center gap-2 col-span-1">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                      <span className="font-mono font-bold text-xs">{chapter.code}</span>
                    </div>
                    <div className="px-3 py-2.5 col-span-4 text-left">
                      <span className="font-heading font-semibold text-sm">{chapter.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">({chapter.items.length} itens)</span>
                    </div>
                    <div className="px-3 py-2.5 text-right font-mono font-bold text-sm">{formatCurrency(chapterTotal)}</div>
                    <div className="px-3 py-2.5" />
                  </button>

                  {isExpanded && (
                    <>
                      {chapter.items.map((item) => (
                        <OrcamentoItemRow key={item.id} item={item}
                          onUpdate={(data) => updateItem({ id: item.id, ...data })}
                          onDelete={() => deleteItem({ id: item.id })}
                          isUpdating={isUpdating} />
                      ))}
                      <div className="grid items-center bg-muted/10 border-t border-dashed border-border/50"
                        style={{ gridTemplateColumns: "2fr 5fr 80px 100px 120px 130px 32px" }}>
                        <div className="px-3 py-2 col-span-6 flex items-center gap-3">
                          <button onClick={() => setAddItemChapterId(chapter.id)}
                            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                            <Plus className="w-3 h-3" /> Adicionar item manualmente
                          </button>
                          <span className="text-border">|</span>
                          <button onClick={() => setAiCompositionChapterId(chapter.id)}
                            className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-700 font-medium transition-colors">
                            <Cpu className="w-3 h-3" /> Gerar composição com IA
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="px-4 py-3 border-t border-border bg-muted/20">
          <button onClick={() => setShowAddChapter(true)}
            className="flex items-center gap-2 text-sm text-primary hover:text-primary-700 font-medium transition-colors">
            <Plus className="w-4 h-4" /> Adicionar Capítulo
          </button>
        </div>

        <div className="border-t-2 border-border bg-muted/30 px-4 py-3 flex justify-end items-center gap-8">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Subtotal</p>
            <p className="font-mono font-bold">{formatCurrency(Number(orcamento.totalValue))}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">BDI ({Number(orcamento.bdiPercentage).toFixed(1)}%)</p>
            <p className="font-mono font-bold">{formatCurrency(Number(orcamento.totalWithBdi) - Number(orcamento.totalValue))}</p>
          </div>
          <div className="text-right bg-primary/10 border border-primary/20 rounded-lg px-4 py-2">
            <p className="text-xs text-primary font-medium">Total Geral com BDI</p>
            <p className="font-heading font-bold text-xl text-primary">{formatCurrency(Number(orcamento.totalWithBdi))}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Item Row ────────────────────────────────────────────────────────────────
function OrcamentoItemRow({ item, onUpdate, onDelete, isUpdating }: {
  item: { id: string; code: string; description: string; unit: string; quantity: unknown; unitPrice: unknown; totalPrice: unknown; source: string | null; };
  onUpdate: (data: { quantity?: number; unitPrice?: number }) => void;
  onDelete: () => void;
  isUpdating: boolean;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [qty, setQty] = useState(String(Number(item.quantity)));
  const [price, setPrice] = useState(String(Number(item.unitPrice)));

  const handleBlur = (field: "quantity" | "unitPrice") => {
    setEditing(null);
    const value = parseFloat(field === "quantity" ? qty : price);
    if (!isNaN(value) && value > 0) onUpdate({ [field]: value });
  };

  return (
    <div className="grid items-center hover:bg-accent/30 transition-colors border-b border-border/50 last:border-0 group"
      style={{ gridTemplateColumns: "2fr 5fr 80px 100px 120px 130px 32px" }}>
      <div className="px-3 py-1.5">
        <span className="font-mono text-xs text-muted-foreground">{item.code}</span>
        {item.source && <span className="block text-[10px] text-muted-foreground/60">{item.source}</span>}
      </div>
      <div className="px-3 py-1.5"><p className="text-sm">{item.description}</p></div>
      <div className="px-3 py-1.5 text-sm text-center font-mono">{item.unit}</div>
      <div className="px-1.5 py-1">
        {editing === "quantity" ? (
          <input autoFocus value={qty} onChange={(e) => setQty(e.target.value)} onBlur={() => handleBlur("quantity")}
            className="w-full text-sm font-mono text-right px-2 py-0.5 rounded border border-primary bg-background focus:outline-none" />
        ) : (
          <button onClick={() => setEditing("quantity")} className="w-full text-sm font-mono text-right px-2 py-0.5 rounded hover:bg-muted/50">
            {Number(item.quantity).toLocaleString("pt-BR", { maximumFractionDigits: 3 })}
          </button>
        )}
      </div>
      <div className="px-1.5 py-1">
        {editing === "unitPrice" ? (
          <input autoFocus value={price} onChange={(e) => setPrice(e.target.value)} onBlur={() => handleBlur("unitPrice")}
            className="w-full text-sm font-mono text-right px-2 py-0.5 rounded border border-primary bg-background focus:outline-none" />
        ) : (
          <button onClick={() => setEditing("unitPrice")} className="w-full text-sm font-mono text-right px-2 py-0.5 rounded hover:bg-muted/50">
            {formatCurrency(Number(item.unitPrice))}
          </button>
        )}
      </div>
      <div className="px-3 py-1.5 text-sm font-mono text-right font-semibold">
        {isUpdating && editing ? <Loader2 className="w-3 h-3 animate-spin ml-auto" /> : formatCurrency(Number(item.totalPrice))}
      </div>
      <div className="px-1 py-1 flex justify-center">
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ── BDI Modal ────────────────────────────────────────────────────────────────
function BdiModal({ bdiPercentage, onSave, onClose, isPending }: {
  bdiPercentage: number; onSave: (bdi: number) => void; onClose: () => void; isPending: boolean;
}) {
  const [bdi, setBdi] = useState(String(bdiPercentage));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-heading font-bold">Configurar BDI</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">BDI Total (%)</label>
            <input type="number" value={bdi} onChange={e => setBdi(e.target.value)} min="0" max="100" step="0.01"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <p className="text-xs text-muted-foreground mt-1">Conforme Acórdão TCU 2622/2013</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground mb-1.5">Composição típica:</p>
            {[["Administração Central", "4-6%"], ["Seguro/Garantia", "0.5-1%"], ["Risco", "1-3%"], ["Despesas Financeiras", "1-2%"], ["Lucro", "6-8%"], ["Tributos (PIS+COFINS+ISS)", "5-8%"]].map(([k, v]) => (
              <div key={k} className="flex justify-between"><span>{k}</span><span className="font-mono">{v}</span></div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted">Cancelar</button>
            <button onClick={() => onSave(parseFloat(bdi) || bdiPercentage)} disabled={isPending}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              {isPending ? "Salvando..." : "Aplicar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Curva ABC Modal ──────────────────────────────────────────────────────────
function CurvaAbcModal({ items, onClose }: {
  items: { code: string; description: string; unit: string; totalPrice: number; percentual: number; percentualAcumulado: number; classe: string; chapter: string }[];
  onClose: () => void;
}) {
  const classeColors: Record<string, string> = { A: "text-red-600 bg-red-50", B: "text-amber-600 bg-amber-50", C: "text-green-600 bg-green-50" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-3xl mx-4 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-heading font-bold">Curva ABC de Serviços</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        {items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Adicione itens ao orçamento para gerar a Curva ABC.</div>
        ) : (
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  {["Classe", "Código", "Descrição", "Capítulo", "Total (R$)", "% Item", "% Acum."].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item, i) => (
                  <tr key={i} className="hover:bg-accent/20 transition-colors">
                    <td className="px-3 py-2">
                      <span className={cn("inline-block px-2 py-0.5 rounded text-xs font-bold", classeColors[item.classe])}>{item.classe}</span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{item.code}</td>
                    <td className="px-3 py-2 max-w-[200px] truncate">{item.description}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{item.chapter}</td>
                    <td className="px-3 py-2 font-mono text-right">{formatCurrency(item.totalPrice)}</td>
                    <td className="px-3 py-2 font-mono text-right">{item.percentual.toFixed(2)}%</td>
                    <td className="px-3 py-2 font-mono text-right">{item.percentualAcumulado.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Add Chapter Modal ────────────────────────────────────────────────────────
function AddChapterModal({ nextOrder, onSave, onClose, isPending }: {
  nextOrder: number; onSave: (code: string, name: string) => void; onClose: () => void; isPending: boolean;
}) {
  const [name, setName] = useState("");
  const code = String(nextOrder).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-heading font-bold">Novo Capítulo</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Código</label>
            <input value={code} disabled className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm opacity-60" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Nome do Capítulo *</label>
            <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Ex: Serviços Preliminares"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              onKeyDown={e => { if (e.key === "Enter" && name.trim()) onSave(code, name.trim()); }} />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted">Cancelar</button>
            <button onClick={() => { if (name.trim()) onSave(code, name.trim()); }} disabled={isPending || !name.trim()}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              {isPending ? "Adicionando..." : "Adicionar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Export Modal ──────────────────────────────────────────────────────────────
function ExportModal({ orcamento, onClose }: { orcamento: OrcamentoData; onClose: () => void }) {
  const [tab, setTab] = useState<"export" | "ai">("export");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState("");

  const aiReview = trpc.orcamento.aiReview.useMutation({
    onSuccess: (data) => setAiResult(data.analysis),
    onError: (err) => toast.error(err.message),
  });

  const exportExcel = async () => {
    try {
    const wb = XLSX.utils.book_new();
    const rows: unknown[][] = [
      ["ORÇAMENTO DE OBRA"],
      [orcamento.name],
      [orcamento.licitacao ? `Licitação: ${orcamento.licitacao.number} — ${orcamento.licitacao.organ}` : ""],
      [`Data: ${new Date().toLocaleDateString("pt-BR")}`],
      [],
      ["Código", "Descrição", "Und", "Quantidade", "Preço Unitário (R$)", "Total (R$)"],
    ];

    orcamento.chapters.forEach((ch) => {
      rows.push([ch.code, ch.name.toUpperCase(), "", "", "", ch.items.reduce((s, i) => s + Number(i.totalPrice), 0)]);
      ch.items.forEach((item) => {
        rows.push([item.code, item.description, item.unit, Number(item.quantity), Number(item.unitPrice), Number(item.totalPrice)]);
      });
    });

    rows.push([]);
    rows.push(["", "SUBTOTAL SEM BDI", "", "", "", Number(orcamento.totalValue)]);
    rows.push(["", `BDI (${Number(orcamento.bdiPercentage).toFixed(2)}%)`, "", "", "", Number(orcamento.totalWithBdi) - Number(orcamento.totalValue)]);
    rows.push(["", "TOTAL GERAL COM BDI", "", "", "", Number(orcamento.totalWithBdi)]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 14 }, { wch: 50 }, { wch: 8 }, { wch: 12 }, { wch: 18 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws, "Orçamento");
    const safeName = orcamento.name.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");
    XLSX.writeFile(wb, `${safeName}.xlsx`);
    toast.success("Excel gerado com sucesso!");
    } catch (err) {
      toast.error("Erro ao gerar Excel: " + (err instanceof Error ? err.message : "Tente novamente"));
    }
  };

  const exportPdf = async () => {
    try {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("ORÇAMENTO DE OBRA", pageW / 2, 15, { align: "center" });
    doc.setFontSize(11);
    doc.text(orcamento.name, pageW / 2, 22, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    if (orcamento.licitacao) doc.text(`Licitação: ${orcamento.licitacao.number} — ${orcamento.licitacao.organ}`, pageW / 2, 28, { align: "center" });
    doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}   |   BDI: ${Number(orcamento.bdiPercentage).toFixed(2)}%`, pageW / 2, 33, { align: "center" });

    const bodyRows: unknown[][] = [];
    orcamento.chapters.forEach((ch) => {
      const chTotal = ch.items.reduce((s, i) => s + Number(i.totalPrice), 0);
      bodyRows.push([{ content: `${ch.code}  ${ch.name}`, colSpan: 5, styles: { fontStyle: "bold", fillColor: [230, 235, 245] } },
        { content: formatCurrency(chTotal), styles: { fontStyle: "bold", fillColor: [230, 235, 245], halign: "right" } }]);
      ch.items.forEach((item) => {
        bodyRows.push([item.code, item.description, item.unit,
          Number(item.quantity).toLocaleString("pt-BR", { maximumFractionDigits: 3 }),
          formatCurrency(Number(item.unitPrice)),
          formatCurrency(Number(item.totalPrice))]);
      });
    });

    autoTable(doc, {
      startY: 38,
      head: [["Código", "Descrição", "Und", "Qtd", "Preço Unit.", "Total"]],
      body: bodyRows as never,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 64, 120], textColor: 255 },
      columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 100 }, 2: { cellWidth: 14, halign: "center" }, 3: { cellWidth: 20, halign: "right" }, 4: { cellWidth: 32, halign: "right" }, 5: { cellWidth: 32, halign: "right" } },
      foot: [
        ["", "Subtotal sem BDI", "", "", "", formatCurrency(Number(orcamento.totalValue))],
        ["", `BDI (${Number(orcamento.bdiPercentage).toFixed(2)}%)`, "", "", "", formatCurrency(Number(orcamento.totalWithBdi) - Number(orcamento.totalValue))],
        ["", "TOTAL GERAL COM BDI", "", "", "", formatCurrency(Number(orcamento.totalWithBdi))],
      ],
      footStyles: { fontStyle: "bold", fillColor: [240, 245, 255] },
    });

    const safeName = orcamento.name.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");
    doc.save(`${safeName}.pdf`);
    toast.success("PDF gerado com sucesso!");
    } catch (err) {
      toast.error("Erro ao gerar PDF: " + (err instanceof Error ? err.message : "Tente novamente"));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl mx-4 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-heading font-bold">Exportar / Revisar com IA</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="flex border-b border-border">
          {([["export", "Exportar"], ["ai", "Revisar com IA"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn("px-5 py-2.5 text-sm font-medium transition-colors", tab === id ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground")}>
              {label}
            </button>
          ))}
        </div>

        <div className="p-5 flex-1 overflow-auto">
          {tab === "export" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Escolha o formato para exportar <strong>{orcamento.name}</strong>:</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={exportExcel}
                  className="flex flex-col items-center gap-3 p-6 border-2 border-border rounded-xl hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/20 transition-all group">
                  <FileSpreadsheet className="w-10 h-10 text-green-600" />
                  <div className="text-center">
                    <p className="font-semibold">Planilha Excel</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Formato .xlsx editável</p>
                  </div>
                </button>
                <button onClick={exportPdf}
                  className="flex flex-col items-center gap-3 p-6 border-2 border-border rounded-xl hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all group">
                  <FileText className="w-10 h-10 text-red-600" />
                  <div className="text-center">
                    <p className="font-semibold">PDF</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Pronto para impressão</p>
                  </div>
                </button>
              </div>
              <div className="bg-muted/40 rounded-lg p-3 text-xs text-muted-foreground">
                <strong>Resumo:</strong> {orcamento.chapters.length} capítulos · {orcamento.chapters.reduce((s, c) => s + c.items.length, 0)} itens · BDI {Number(orcamento.bdiPercentage).toFixed(1)}% · Total: {formatCurrency(Number(orcamento.totalWithBdi))}
              </div>
            </div>
          )}

          {tab === "ai" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-lg p-3">
                <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">A IA analisa seu orçamento e sugere melhorias: itens faltando, preços atípicos, otimizações de BDI e conformidade com SINAPI/Lei 14.133.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Instrução para a IA (opcional)</label>
                <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} rows={3}
                  placeholder="Ex: Verifique se os preços estão compatíveis com SINAPI SP Jan/2026. Identifique serviços faltantes para pavimentação urbana."
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
              <button onClick={() => aiReview.mutate({ id: orcamento.id, prompt: aiPrompt })}
                disabled={aiReview.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
                {aiReview.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Analisando...</> : <><Send className="w-4 h-4" /> Analisar com IA</>}
              </button>
              {aiResult && (
                <div className="bg-muted/30 border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Análise da IA</span>
                  </div>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{aiResult}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Add Item Modal ────────────────────────────────────────────────────────────
function AddItemModal({ chapterId, nextOrder, chapterCode, onSave, onClose, isPending }: {
  chapterId: string; nextOrder: number; chapterCode: string;
  onSave: (data: { code: string; description: string; unit: string; quantity: number; unitPrice: number; source?: string; order: number }) => void;
  onClose: () => void; isPending: boolean;
}) {
  const [form, setForm] = useState({ description: "", unit: "un", quantity: "", unitPrice: "", source: "" });
  const [error, setError] = useState("");
  const code = `${chapterCode}.${String(nextOrder).padStart(3, "0")}`;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim()) { setError("Descrição é obrigatória"); return; }
    const qty = parseFloat(form.quantity);
    const price = parseFloat(form.unitPrice);
    if (isNaN(qty) || qty <= 0) { setError("Quantidade deve ser maior que zero"); return; }
    if (isNaN(price) || price <= 0) { setError("Preço unitário deve ser maior que zero"); return; }
    onSave({ code, description: form.description.trim(), unit: form.unit, quantity: qty, unitPrice: price, source: form.source || undefined, order: nextOrder });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-heading font-bold">Novo Item</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Código</label>
              <input value={code} disabled className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm opacity-60 font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Unidade *</label>
              <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none">
                {["un", "m", "m²", "m³", "kg", "t", "l", "vb", "h", "dia", "mês", "pç"].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Descrição *</label>
            <input autoFocus type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Ex: Escavação mecânica em solo"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Quantidade *</label>
              <input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                placeholder="0,00" min="0" step="0.001"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Preço Unitário (R$) *</label>
              <input type="number" value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))}
                placeholder="0,00" min="0" step="0.01"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Referência (SINAPI/SICRO/ORSE-SE/SEINFRA/etc.)</label>
            <input type="text" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
              placeholder="Ex: SINAPI 74209/001 | ORSE-SE | SEINFRA"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          {form.quantity && form.unitPrice && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 text-sm">
              <span className="text-muted-foreground">Total: </span>
              <span className="font-heading font-bold text-primary">
                {formatCurrency((parseFloat(form.quantity) || 0) * (parseFloat(form.unitPrice) || 0))}
              </span>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted">Cancelar</button>
            <button type="submit" disabled={isPending}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              {isPending ? "Adicionando..." : "Adicionar Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── AI Composition Modal ──────────────────────────────────────────────────────
interface AiCompositionData {
  code: string; description: string; unit: string; unitCost: number; source?: string;
  inputs: { type: "MATERIAL" | "LABOR" | "EQUIPMENT" | "OTHER"; code: string; description: string; unit: string; coefficient: number; unitPrice: number; }[];
}
function AiCompositionModal({ chapterId, onSave, onClose, isPending }: {
  chapterId: string;
  onSave: (data: { description: string; unit: string; quantity: number; source?: string; composition: AiCompositionData }) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const [step, setStep] = useState<"describe" | "review">("describe");
  const [serviceDesc, setServiceDesc] = useState("");
  const [unit, setUnit] = useState("");
  const [region, setRegion] = useState("Nordeste/SE");
  const [context, setContext] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [composition, setComposition] = useState<AiCompositionData | null>(null);
  const [error, setError] = useState("");

  const generateMutation = trpc.orcamento.generateComposition.useMutation({
    onSuccess: (data) => {
      setComposition(data.composition as AiCompositionData);
      setUnit(data.composition.unit ?? unit);
      setStep("review");
    },
    onError: (err) => setError(err.message),
  });

  const INPUT_TYPE_ICONS: Record<string, React.ReactNode> = {
    MATERIAL: <Package className="w-3.5 h-3.5 text-blue-500" />,
    LABOR: <HardHat className="w-3.5 h-3.5 text-amber-500" />,
    EQUIPMENT: <Wrench className="w-3.5 h-3.5 text-slate-500" />,
    OTHER: <Cpu className="w-3.5 h-3.5 text-muted-foreground" />,
  };
  const INPUT_TYPE_LABELS: Record<string, string> = { MATERIAL: "Material", LABOR: "Mão de Obra", EQUIPMENT: "Equipamento", OTHER: "Outro" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            {step === "review" && (
              <button onClick={() => setStep("describe")} className="p-1 rounded hover:bg-muted">
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <Cpu className="w-4 h-4 text-violet-600" />
            <h2 className="text-base font-heading font-bold">
              {step === "describe" ? "Gerar Composição com IA" : "Revisar Composição Gerada"}
            </h2>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {step === "describe" ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-lg p-3">
                <Cpu className="w-4 h-4 text-violet-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">Descreva o serviço em linguagem natural. A IA gerará automaticamente a composição de preço unitário com materiais, mão de obra e equipamentos.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Descreva o serviço *</label>
                <textarea value={serviceDesc} onChange={e => setServiceDesc(e.target.value)} rows={3} autoFocus
                  placeholder="Ex: Concreto usinado fck=25MPa, lançado e adensado em fundações, incluindo forma, armadura e cura"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Unidade de medida</label>
                  <select value={unit} onChange={e => setUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30">
                    <option value="">Deixar a IA decidir</option>
                    {["m²", "m³", "m", "kg", "t", "un", "vb", "h", "dia", "mês", "pç", "l"].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Região de referência</label>
                  <select value={region} onChange={e => setRegion(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30">
                    {["Nordeste/SE", "Norte", "Centro-Oeste", "Sudeste", "Sul"].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Contexto adicional (opcional)</label>
                <input type="text" value={context} onChange={e => setContext(e.target.value)}
                  placeholder="Ex: Obra de drenagem urbana, padrão SEINFRA, preços 2026"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
              </div>
              {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}
            </div>
          ) : composition && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{composition.code}</p>
                    <p className="font-medium text-sm mt-0.5">{composition.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">Custo unitário</p>
                    <p className="font-heading font-bold text-primary text-base">{formatCurrency(composition.unitCost)}/{composition.unit}</p>
                  </div>
                </div>
                {composition.source && <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{composition.source}</span>}
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Insumos da Composição</p>
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="grid bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                    style={{ gridTemplateColumns: "80px 1fr 50px 80px 100px 100px" }}>
                    {["Tipo", "Descrição", "Und", "Coef.", "P. Unit.", "Total"].map(h => <div key={h} className="px-2 py-2">{h}</div>)}
                  </div>
                  <div className="divide-y divide-border">
                    {composition.inputs.map((inp, i) => (
                      <div key={i} className="grid items-center text-sm hover:bg-accent/20"
                        style={{ gridTemplateColumns: "80px 1fr 50px 80px 100px 100px" }}>
                        <div className="px-2 py-1.5 flex items-center gap-1.5">
                          {INPUT_TYPE_ICONS[inp.type]}
                          <span className="text-xs">{INPUT_TYPE_LABELS[inp.type]}</span>
                        </div>
                        <div className="px-2 py-1.5">
                          <p className="text-sm">{inp.description}</p>
                          <p className="text-xs text-muted-foreground font-mono">{inp.code}</p>
                        </div>
                        <div className="px-2 py-1.5 font-mono text-xs">{inp.unit}</div>
                        <div className="px-2 py-1.5 font-mono text-xs text-right">{inp.coefficient.toFixed(4)}</div>
                        <div className="px-2 py-1.5 font-mono text-xs text-right">{formatCurrency(inp.unitPrice)}</div>
                        <div className="px-2 py-1.5 font-mono text-xs text-right font-semibold">
                          {formatCurrency(inp.coefficient * inp.unitPrice)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid bg-muted/30 font-semibold text-sm border-t-2 border-border"
                    style={{ gridTemplateColumns: "80px 1fr 50px 80px 100px 100px" }}>
                    <div className="px-2 py-2 col-span-5 text-right text-xs text-muted-foreground">Custo Unitário Total:</div>
                    <div className="px-2 py-2 font-mono text-right text-primary">{formatCurrency(composition.unitCost)}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Quantidade *</label>
                  <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} min="0.001" step="0.001"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Unidade</label>
                  <input type="text" value={unit || composition.unit} onChange={e => setUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              {quantity && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-2.5 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total estimado ({quantity} {unit || composition.unit}):</span>
                  <span className="font-heading font-bold text-primary text-lg">{formatCurrency((parseFloat(quantity) || 0) * composition.unitCost)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted">Cancelar</button>
          {step === "describe" ? (
            <button
              onClick={() => { setError(""); generateMutation.mutate({ description: serviceDesc, unit: unit || undefined, region, context: context || undefined }); }}
              disabled={!serviceDesc.trim() || generateMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
              {generateMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Gerando...</> : <><Cpu className="w-4 h-4" />Gerar Composição</>}
            </button>
          ) : (
            <button
              onClick={() => {
                if (!composition) return;
                const qty = parseFloat(quantity);
                if (isNaN(qty) || qty <= 0) { toast.error("Informe uma quantidade válida"); return; }
                onSave({ description: composition.description, unit: unit || composition.unit, quantity: qty, source: composition.source, composition });
              }}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Adicionando...</> : <><Plus className="w-4 h-4" />Adicionar ao Orçamento</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Import Planilha Modal ─────────────────────────────────────────────────────
interface PreviewItem {
  id: string; // temp client id
  code: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  source?: string;
}
interface PreviewChapter {
  id: string; // temp client id
  code: string;
  name: string;
  items: PreviewItem[];
}

function ImportPlanilhaModal({ orcamentoId, onSuccess, onClose }: {
  orcamentoId: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"upload" | "edit" | "done">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState<"auto" | "ai">("auto");
  const [previewChapters, setPreviewChapters] = useState<PreviewChapter[]>([]);
  const [expandedChapters, setExpandedChapters] = useState<string[]>([]);
  const [result, setResult] = useState<{ chaptersCreated: number; itemsCreated: number; mode?: string } | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isPdf = file?.name?.toLowerCase().endsWith(".pdf") ?? false;

  const totalItems = previewChapters.reduce((s, c) => s + c.items.length, 0);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setError(""); }
  };

  // Step 1 → 2: parse file, get preview
  const handlePreview = async () => {
    if (!file) return;
    setIsProcessing(true); setError("");
    const form = new FormData();
    form.append("file", file);
    form.append("orcamentoId", orcamentoId);
    form.append("mode", isPdf ? "ai" : mode);
    form.append("preview", "true");
    try {
      const res = await fetch("/api/orcamento/import-planilha", { method: "POST", body: form });
      const json = await res.json() as { chapters?: { code: string; name: string; items: { code: string; description: string; unit: string; quantity: number; unitPrice: number; source?: string }[] }[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erro ao processar arquivo");
      const chapters: PreviewChapter[] = (json.chapters ?? []).map((ch, ci) => ({
        id: `ch-${ci}`,
        code: ch.code,
        name: ch.name,
        items: (ch.items ?? []).map((it, ii) => ({
          id: `it-${ci}-${ii}`,
          code: it.code,
          description: it.description,
          unit: it.unit || "un",
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          source: it.source,
        })),
      }));
      setPreviewChapters(chapters);
      setExpandedChapters(chapters.map(c => c.id));
      setStep("edit");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2 → 3: save edited chapters
  const handleSave = async () => {
    setIsSaving(true); setError("");
    try {
      const body = {
        orcamentoId,
        chapters: previewChapters
          .filter(c => c.items.length > 0)
          .map(c => ({
            code: c.code,
            name: c.name,
            items: c.items.map(it => ({
              code: it.code,
              description: it.description,
              unit: it.unit,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              source: it.source,
            })),
          })),
      };
      const res = await fetch("/api/orcamento/import-planilha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json() as { chaptersCreated?: number; itemsCreated?: number; error?: string; mode?: string };
      if (!res.ok) throw new Error(json.error ?? "Erro ao salvar");
      setResult({ chaptersCreated: json.chaptersCreated ?? 0, itemsCreated: json.itemsCreated ?? 0, mode: json.mode });
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsSaving(false);
    }
  };

  // Edit helpers
  const updateChapterName = (chId: string, name: string) =>
    setPreviewChapters(prev => prev.map(c => c.id === chId ? { ...c, name } : c));
  const deleteChapter = (chId: string) =>
    setPreviewChapters(prev => prev.filter(c => c.id !== chId));
  const updateItem = (chId: string, itId: string, field: keyof PreviewItem, val: string | number) =>
    setPreviewChapters(prev => prev.map(c => c.id === chId
      ? { ...c, items: c.items.map(it => it.id === itId ? { ...it, [field]: val } : it) }
      : c
    ));
  const deleteItem = (chId: string, itId: string) =>
    setPreviewChapters(prev => prev.map(c => c.id === chId
      ? { ...c, items: c.items.filter(it => it.id !== itId) }
      : c
    ));
  const toggleChapter = (chId: string) =>
    setExpandedChapters(prev => prev.includes(chId) ? prev.filter(id => id !== chId) : [...prev, chId]);

  const modalMaxW = step === "edit" ? "max-w-4xl" : "max-w-lg";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={step !== "edit" ? onClose : undefined} />
      <div className={cn("relative bg-card border border-border rounded-xl shadow-xl w-full mx-4 flex flex-col", modalMaxW, step === "edit" ? "max-h-[90vh]" : "")}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <h2 className="text-base font-heading font-bold">
              {step === "upload" && "Importar Planilha do Edital"}
              {step === "edit" && `Revisar e Editar — ${previewChapters.length} capítulos · ${totalItems} itens`}
              {step === "done" && "Importação concluída!"}
            </h2>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        {/* Body */}
        <div className={cn("p-5 overflow-y-auto", step === "edit" && "flex-1")}>

          {/* ── STEP 1: Upload ── */}
          {step === "upload" && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                  isDragging ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" : "border-border hover:border-emerald-400 hover:bg-muted/30"
                )}>
                <input ref={inputRef} type="file"
                  accept=".xlsx,.xls,.csv,.pdf,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setError(""); } }}
                />
                <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                {file ? (
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{(file.size / 1024).toFixed(1)} KB · clique para trocar</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium">Arraste ou clique para selecionar</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Excel (.xlsx, .xls, .csv) ou PDF · máx 20MB</p>
                  </div>
                )}
              </div>

              {!isPdf && (
                <div className="rounded-lg border border-border overflow-hidden">
                  <button type="button" onClick={() => setMode("auto")}
                    className={cn("w-full flex items-start gap-3 p-3 text-left transition-colors",
                      mode === "auto" ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-card hover:bg-muted/40")}>
                    <div className={cn("w-4 h-4 mt-0.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                      mode === "auto" ? "border-emerald-600" : "border-muted-foreground")}>
                      {mode === "auto" && <div className="w-2 h-2 rounded-full bg-emerald-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Importação direta {mode === "auto" && <span className="text-xs text-emerald-600 font-normal">(recomendado)</span>}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Detecta colunas CÓDIGO, DESCRIÇÃO, UNIDADE, QUANTIDADE e PREÇO UNIT. Rápido, sem IA.</p>
                    </div>
                  </button>
                  <div className="border-t border-border" />
                  <button type="button" onClick={() => setMode("ai")}
                    className={cn("w-full flex items-start gap-3 p-3 text-left transition-colors",
                      mode === "ai" ? "bg-violet-50 dark:bg-violet-950/20" : "bg-card hover:bg-muted/40")}>
                    <div className={cn("w-4 h-4 mt-0.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                      mode === "ai" ? "border-violet-600" : "border-muted-foreground")}>
                      {mode === "ai" && <div className="w-2 h-2 rounded-full bg-violet-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Interpretar com IA</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Claude lê e estrutura qualquer formato, inclusive planilhas sem padrão definido.</p>
                    </div>
                  </button>
                </div>
              )}

              {isPdf && (
                <div className="flex items-start gap-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-lg p-3">
                  <Sparkles className="w-4 h-4 text-violet-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">PDFs são sempre interpretados pela IA. Requer <code className="text-violet-600">ANTHROPIC_API_KEY</code>.</p>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/10 border border-red-200 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted">Cancelar</button>
                <button onClick={handlePreview} disabled={!file || isProcessing}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors",
                    (mode === "ai" || isPdf) ? "bg-violet-600 hover:bg-violet-700" : "bg-emerald-600 hover:bg-emerald-700"
                  )}>
                  {isProcessing
                    ? <><Loader2 className="w-4 h-4 animate-spin" />{mode === "ai" || isPdf ? "Processando com IA..." : "Lendo arquivo..."}</>
                    : <><Upload className="w-4 h-4" />Avançar para Revisão</>
                  }
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Edit ── */}
          {step === "edit" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-3">
                Revise os dados extraídos. Edite descrições, quantidades e preços antes de confirmar.
              </p>
              {previewChapters.map((ch) => (
                <div key={ch.id} className="border border-border rounded-lg overflow-hidden">
                  {/* Chapter header */}
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-2">
                    <button onClick={() => toggleChapter(ch.id)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
                      {expandedChapters.includes(ch.id)
                        ? <ChevronDown className="w-4 h-4" />
                        : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <input
                      value={ch.name}
                      onChange={(e) => updateChapterName(ch.id, e.target.value)}
                      className="flex-1 text-sm font-semibold bg-transparent focus:outline-none focus:bg-background focus:border focus:border-border rounded px-1 py-0.5"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-xs text-muted-foreground ml-auto mr-2">{ch.items.length} itens</span>
                    <button onClick={() => deleteChapter(ch.id)} className="text-muted-foreground hover:text-red-600 transition-colors flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Items table */}
                  {expandedChapters.includes(ch.id) && ch.items.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border bg-muted/20">
                            <th className="text-left px-2 py-1.5 font-medium text-muted-foreground w-20">Código</th>
                            <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Descrição</th>
                            <th className="text-left px-2 py-1.5 font-medium text-muted-foreground w-16">Und</th>
                            <th className="text-right px-2 py-1.5 font-medium text-muted-foreground w-20">Qtd</th>
                            <th className="text-right px-2 py-1.5 font-medium text-muted-foreground w-24">Preço Unit</th>
                            <th className="text-right px-2 py-1.5 font-medium text-muted-foreground w-24">Total</th>
                            <th className="w-8" />
                          </tr>
                        </thead>
                        <tbody>
                          {ch.items.map((it) => (
                            <tr key={it.id} className="border-b border-border/50 hover:bg-muted/10 group">
                              <td className="px-2 py-1">
                                <input value={it.code} onChange={(e) => updateItem(ch.id, it.id, "code", e.target.value)}
                                  className="w-full bg-transparent focus:bg-background focus:border focus:border-border rounded px-1 focus:outline-none font-mono" />
                              </td>
                              <td className="px-2 py-1">
                                <input value={it.description} onChange={(e) => updateItem(ch.id, it.id, "description", e.target.value)}
                                  className="w-full bg-transparent focus:bg-background focus:border focus:border-border rounded px-1 focus:outline-none" />
                              </td>
                              <td className="px-2 py-1">
                                <input value={it.unit} onChange={(e) => updateItem(ch.id, it.id, "unit", e.target.value)}
                                  className="w-full bg-transparent focus:bg-background focus:border focus:border-border rounded px-1 focus:outline-none text-center" />
                              </td>
                              <td className="px-2 py-1">
                                <input type="number" value={it.quantity}
                                  onChange={(e) => updateItem(ch.id, it.id, "quantity", parseFloat(e.target.value) || 0)}
                                  className="w-full bg-transparent focus:bg-background focus:border focus:border-border rounded px-1 focus:outline-none text-right font-mono" />
                              </td>
                              <td className="px-2 py-1">
                                <input type="number" value={it.unitPrice}
                                  onChange={(e) => updateItem(ch.id, it.id, "unitPrice", parseFloat(e.target.value) || 0)}
                                  className="w-full bg-transparent focus:bg-background focus:border focus:border-border rounded px-1 focus:outline-none text-right font-mono" />
                              </td>
                              <td className="px-2 py-1 text-right font-mono text-muted-foreground">
                                {(it.quantity * it.unitPrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </td>
                              <td className="px-2 py-1">
                                <button onClick={() => deleteItem(ch.id, it.id)}
                                  className="text-muted-foreground hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {expandedChapters.includes(ch.id) && ch.items.length === 0 && (
                    <p className="text-xs text-muted-foreground px-3 py-2 italic">Capítulo vazio — será ignorado na importação</p>
                  )}
                </div>
              ))}

              {error && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/10 border border-red-200 rounded-lg px-3 py-2 mt-3">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Done ── */}
          {step === "done" && (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <p className="font-heading font-bold text-lg">Importação concluída!</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{result?.chaptersCreated}</span> capítulos e{" "}
                <span className="font-semibold text-foreground">{result?.itemsCreated}</span> itens importados.
              </p>
              <p className="text-xs text-emerald-600 font-medium">✓ Dados revisados e salvos</p>
              <button onClick={onSuccess} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
                Ver Orçamento
              </button>
            </div>
          )}
        </div>

        {/* Footer for edit step */}
        {step === "edit" && (
          <div className="flex items-center justify-between gap-3 p-4 border-t border-border flex-shrink-0 bg-card">
            <button onClick={() => setStep("upload")} className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <button onClick={handleSave} disabled={isSaving || totalItems === 0}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
              {isSaving
                ? <><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>
                : <><CheckCircle2 className="w-4 h-4" />Confirmar e Importar ({totalItems} itens)</>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── AI Command Bar ────────────────────────────────────────────────────────────
interface CommandEntry { role: "user" | "assistant"; text: string; }

function AiCommandBar({ orcamentoId, onCommand, isRunning }: {
  orcamentoId: string;
  onCommand: (cmd: string) => Promise<{ summary: string; actionsExecuted: number } | void> | void;
  isRunning: boolean;
}) {
  const [command, setCommand] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [history, setHistory] = useState<CommandEntry[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  // Scroll history to bottom
  useEffect(() => {
    if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight;
  }, [history]);

  const handleSend = async () => {
    const cmd = command.trim();
    if (!cmd || isRunning) return;
    setHistory(h => [...h, { role: "user", text: cmd }]);
    setCommand("");
    try {
      const result = await (onCommand(cmd) as Promise<{ summary: string; actionsExecuted: number }>);
      if (result?.summary) {
        setHistory(h => [...h, { role: "assistant", text: result.summary }]);
      }
    } catch {
      setHistory(h => [...h, { role: "assistant", text: "Erro ao executar o comando. Tente novamente." }]);
    }
  };

  const startVoice = () => {
    type SRConstructor = new () => { lang: string; interimResults: boolean; maxAlternatives: number; start: () => void; onresult: ((e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void) | null; onerror: (() => void) | null };
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: SRConstructor; webkitSpeechRecognition?: SRConstructor }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: SRConstructor }).webkitSpeechRecognition;

    if (!SpeechRecognition) { toast.error("Seu navegador não suporta reconhecimento de voz"); return; }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setCommand(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    (recognition as unknown as { onend: () => void }).onend = () => setIsListening(false);
    recognition.start();
  };

  const examples = [
    "Adicione 50m² de alvenaria de vedação em tijolo cerâmico no capítulo 02, R$85/m²",
    "Mude o BDI para 28%",
    "Adicione um capítulo chamado Instalações Elétricas",
    "Atualize o preço do item de escavação para R$45/m³",
  ];

  return (
    <div className="bg-card border border-indigo-200 dark:border-indigo-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-indigo-50 dark:bg-indigo-950/30 border-b border-indigo-200 dark:border-indigo-800 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-indigo-600" />
        <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">Assistente IA — Edição por Comando</span>
        <span className="ml-auto text-xs text-muted-foreground">Digite ou fale para editar o orçamento</span>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div ref={historyRef} className="max-h-48 overflow-y-auto px-4 py-3 space-y-2 border-b border-border">
          {history.map((entry, i) => (
            <div key={i} className={cn("flex gap-2.5", entry.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                entry.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              )}>
                {entry.role === "assistant" && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                    <Sparkles className="w-3 h-3" /> IA
                  </span>
                )}
                {entry.text}
              </div>
            </div>
          ))}
          {isRunning && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-xl px-3 py-2 text-sm flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Executando...
              </div>
            </div>
          )}
        </div>
      )}

      {/* Examples (only when no history) */}
      {history.length === 0 && (
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Exemplos de comandos:</p>
          <div className="flex flex-wrap gap-1.5">
            {examples.map((ex) => (
              <button key={ex} onClick={() => setCommand(ex)}
                className="text-xs px-2.5 py-1 bg-muted hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950/30 rounded-lg border border-border transition-colors">
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 flex gap-2 items-end">
        <textarea
          ref={inputRef}
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={isListening ? "Ouvindo..." : "Digite ou fale um comando... (Enter para enviar, Shift+Enter nova linha)"}
          rows={2}
          disabled={isListening}
          className={cn(
            "flex-1 text-sm px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none",
            isListening && "border-red-400 bg-red-50 dark:bg-red-950/10"
          )}
        />
        <div className="flex flex-col gap-1.5">
          <button onClick={startVoice} disabled={isListening || isRunning} title="Falar comando"
            className={cn(
              "p-2 rounded-lg border transition-all",
              isListening
                ? "border-red-400 bg-red-50 text-red-600 dark:bg-red-950/20 animate-pulse"
                : "border-border hover:border-red-300 hover:bg-red-50 hover:text-red-600 text-muted-foreground"
            )}>
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button onClick={handleSend} disabled={!command.trim() || isRunning}
            className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
