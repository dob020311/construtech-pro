"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Plus, Trash2, ChevronDown, ChevronRight, Settings, BarChart3,
  Download, Loader2, X, FileSpreadsheet, FileText, Sparkles, Send,
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
  const [expandedChapters, setExpandedChapters] = useState<string[]>([]);
  const [showBdiModal, setShowBdiModal] = useState(false);
  const [showCurvaAbc, setShowCurvaAbc] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [addItemChapterId, setAddItemChapterId] = useState<string | null>(null);
  const utils = trpc.useUtils();

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
          chapterId={addItemChapterId}
          nextOrder={(orcamento.chapters.find(c => c.id === addItemChapterId)?.items.length ?? 0) + 1}
          chapterCode={orcamento.chapters.find(c => c.id === addItemChapterId)?.code ?? ""}
          onSave={(data) => addItem({ ...data, chapterId: addItemChapterId })}
          onClose={() => setAddItemChapterId(null)}
          isPending={isAddingItem}
        />
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
        <div className="flex items-center gap-2">
          <button onClick={() => setShowExport(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted transition-colors">
            <Download className="w-3.5 h-3.5" /> Exportar / IA
          </button>
          <button onClick={() => setShowBdiModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted transition-colors">
            <Settings className="w-3.5 h-3.5" /> BDI
          </button>
          <button onClick={() => setShowCurvaAbc(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors">
            <BarChart3 className="w-3.5 h-3.5" /> Curva ABC
          </button>
        </div>
      </div>

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
                      <div onClick={() => setAddItemChapterId(chapter.id)}
                        className="grid items-center bg-muted/10 hover:bg-muted/20 cursor-pointer transition-colors"
                        style={{ gridTemplateColumns: "2fr 5fr 80px 100px 120px 130px 32px" }}>
                        <div className="px-3 py-2 col-span-6 flex items-center gap-2 text-xs text-primary hover:text-primary-700">
                          <Plus className="w-3 h-3" /> Adicionar item em {chapter.name}
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
    XLSX.writeFile(wb, `${orcamento.name.replace(/\s+/g, "_")}.xlsx`);
    toast.success("Excel gerado com sucesso!");
  };

  const exportPdf = async () => {
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

    doc.save(`${orcamento.name.replace(/\s+/g, "_")}.pdf`);
    toast.success("PDF gerado com sucesso!");
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
            <label className="block text-sm font-medium mb-1.5">Referência (SINAPI/SICRO/etc.)</label>
            <input type="text" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
              placeholder="Ex: SINAPI 74209/001"
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
