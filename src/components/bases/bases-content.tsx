"use client";

import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Database,
  Plus,
  Search,
  Trash2,
  ChevronRight,
  X,
  Download,
  Tag,
  Upload,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

type Source = "SINAPI" | "ORSE" | "SEINFRA" | "SICRO" | "CUSTOM";

const SOURCE_LABELS: Record<Source, string> = {
  SINAPI: "SINAPI",
  ORSE: "ORSE",
  SEINFRA: "SEINFRA",
  SICRO: "SICRO",
  CUSTOM: "Personalizada",
};

const SOURCE_COLORS: Record<Source, string> = {
  SINAPI: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  ORSE: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  SEINFRA: "bg-green-500/20 text-green-300 border border-green-500/30",
  SICRO: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
  CUSTOM: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
};

const CATEGORIES = [
  "Estrutura",
  "Alvenaria",
  "Revestimento",
  "Instalações",
  "Piso",
  "Pintura",
  "Impermeabilização",
  "Esquadrias",
  "Hidráulica",
  "Outros",
];

const SINAPI_SAMPLE = [
  {
    code: "87492",
    description:
      "Concreto fck=25 MPa, inclusive lançamento, adensamento e acabamento",
    unit: "m3",
    unitPrice: 447.8,
    category: "Estrutura",
    source: "SINAPI",
  },
  {
    code: "94992",
    description: "Aço CA-50, diam. 10 mm, corte, dobramento e colocação",
    unit: "kg",
    unitPrice: 14.5,
    category: "Estrutura",
    source: "SINAPI",
  },
  {
    code: "74209",
    description: "Forma em chapa compensada resinada, e=12mm",
    unit: "m2",
    unitPrice: 78.3,
    category: "Estrutura",
    source: "SINAPI",
  },
  {
    code: "88309",
    description: "Alvenaria de vedação de blocos cerâmicos furados",
    unit: "m2",
    unitPrice: 68.9,
    category: "Alvenaria",
    source: "SINAPI",
  },
  {
    code: "87880",
    description: "Revestimento de paredes com argamassa traço 1:2:8",
    unit: "m2",
    unitPrice: 32.4,
    category: "Revestimento",
    source: "SINAPI",
  },
  {
    code: "87264",
    description: "Impermeabilização de superfície com manta asfáltica",
    unit: "m2",
    unitPrice: 94.6,
    category: "Impermeabilização",
    source: "SINAPI",
  },
  {
    code: "73762",
    description: "Vidro liso transparente esp. 4mm",
    unit: "m2",
    unitPrice: 87.2,
    category: "Esquadrias",
    source: "SINAPI",
  },
  {
    code: "91534",
    description: "Pintura látex PVA, 2 demãos",
    unit: "m2",
    unitPrice: 14.8,
    category: "Pintura",
    source: "SINAPI",
  },
  {
    code: "83931",
    description: "Piso cerâmico PEI-4, 45x45cm, assentado com argamassa",
    unit: "m2",
    unitPrice: 72.3,
    category: "Piso",
    source: "SINAPI",
  },
  {
    code: "96599",
    description: "Tubulação PVC rígido soldável DN 25mm, água fria",
    unit: "m",
    unitPrice: 18.7,
    category: "Hidráulica",
    source: "SINAPI",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function SourceBadge({ source }: { source: string }) {
  const color =
    SOURCE_COLORS[source as Source] ??
    "bg-slate-500/20 text-slate-300 border border-slate-500/30";
  const label = SOURCE_LABELS[source as Source] ?? source;
  return (
    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", color)}>
      {label}
    </span>
  );
}

// ─── Nova Base Modal ─────────────────────────────────────────────────────────

function NovaBaseModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState<Source>("SINAPI");
  const [region, setRegion] = useState("");
  const [error, setError] = useState("");

  const utils = trpc.useUtils();
  const create = trpc.basePreco.create.useMutation({
    onSuccess: () => {
      utils.basePreco.list.invalidate();
      toast.success("Base criada com sucesso");
      onClose();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nome é obrigatório");
      return;
    }
    setError("");
    create.mutate({ name: name.trim(), description: description || undefined, source, region: region || undefined });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[hsl(218,35%,10%)] border border-[hsl(218,35%,18%)] rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Nova Base de Preços</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[hsl(218,35%,16%)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Nome <span className="text-red-400">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: SINAPI Nacional 2024"
              className="w-full bg-[hsl(218,35%,14%)] border border-[hsl(218,35%,22%)] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
            />
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional..."
              rows={2}
              className="w-full bg-[hsl(218,35%,14%)] border border-[hsl(218,35%,22%)] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Fonte
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as Source)}
              className="w-full bg-[hsl(218,35%,14%)] border border-[hsl(218,35%,22%)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
            >
              <option value="SINAPI">SINAPI</option>
              <option value="ORSE">ORSE</option>
              <option value="SEINFRA">SEINFRA</option>
              <option value="SICRO">SICRO</option>
              <option value="CUSTOM">Personalizada</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Região
            </label>
            <input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="Ex: Nacional, SE, BA"
              className="w-full bg-[hsl(218,35%,14%)] border border-[hsl(218,35%,22%)] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {create.isPending ? "Criando..." : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Adicionar Item Modal ────────────────────────────────────────────────────

function AdicionarItemModal({
  baseId,
  onClose,
}: {
  baseId: string;
  onClose: () => void;
}) {
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [category, setCategory] = useState("");

  const utils = trpc.useUtils();
  const add = trpc.basePreco.addItem.useMutation({
    onSuccess: () => {
      utils.basePreco.getById.invalidate({ id: baseId });
      utils.basePreco.list.invalidate();
      toast.success("Item adicionado");
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !description.trim() || !unit.trim() || !unitPrice) return;
    add.mutate({
      baseId,
      code: code.trim(),
      description: description.trim(),
      unit: unit.trim(),
      unitPrice: parseFloat(unitPrice),
      category: category || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[hsl(218,35%,10%)] border border-[hsl(218,35%,18%)] rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Adicionar Item</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[hsl(218,35%,16%)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Código <span className="text-red-400">*</span>
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: 87492"
                className="w-full bg-[hsl(218,35%,14%)] border border-[hsl(218,35%,22%)] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Unidade <span className="text-red-400">*</span>
              </label>
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Ex: m2, m3, kg"
                className="w-full bg-[hsl(218,35%,14%)] border border-[hsl(218,35%,22%)] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Descrição <span className="text-red-400">*</span>
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do insumo"
              className="w-full bg-[hsl(218,35%,14%)] border border-[hsl(218,35%,22%)] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Preço Unitário <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0,00"
                className="w-full bg-[hsl(218,35%,14%)] border border-[hsl(218,35%,22%)] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[hsl(218,35%,14%)] border border-[hsl(218,35%,22%)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">Selecionar...</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={add.isPending || !code || !description || !unit || !unitPrice}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {add.isPending ? "Adicionando..." : "Adicionar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Base Detail Panel ────────────────────────────────────────────────────────

function BaseDetail({
  baseId,
  baseName,
  onBack,
}: {
  baseId: string;
  baseName: string;
  onBack: () => void;
}) {
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [showAddItem, setShowAddItem] = useState(false);
  const [importingSinapi, setImportingSinapi] = useState(false);
  const sinapiFileRef = useRef<HTMLInputElement>(null);
  const LIMIT = 50;

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.basePreco.getById.useQuery({
    id: baseId,
    offset,
    limit: LIMIT,
  });

  const { data: searchResults } = trpc.basePreco.searchItems.useQuery(
    { baseId, query: search },
    { enabled: search.length >= 2 }
  );

  const deleteItem = trpc.basePreco.deleteItem.useMutation({
    onSuccess: () => {
      utils.basePreco.getById.invalidate({ id: baseId });
      utils.basePreco.list.invalidate();
      toast.success("Item removido");
    },
    onError: (err) => toast.error(err.message),
  });

  const importItems = trpc.basePreco.importItems.useMutation({
    onSuccess: (result) => {
      utils.basePreco.getById.invalidate({ id: baseId });
      utils.basePreco.list.invalidate();
      toast.success(
        `Amostra importada: ${result.created} criados, ${result.updated} atualizados`
      );
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSinapiFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setImportingSinapi(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("baseId", baseId);
      formData.append("useDesoneracao", "true");

      const res = await fetch("/api/bases/import-sinapi", {
        method: "POST",
        body: formData,
      });

      const data = await res.json() as {
        success?: boolean; error?: string;
        created?: number; updated?: number; total?: number; skipped?: number; message?: string;
      };

      if (!res.ok || !data.success) {
        toast.error(data.error ?? "Erro na importação");
      } else {
        toast.success(data.message ?? `Importados: ${data.total} itens`);
        utils.basePreco.getById.invalidate({ id: baseId });
        utils.basePreco.list.invalidate();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao importar planilha");
    } finally {
      setImportingSinapi(false);
    }
  };

  const displayItems =
    search.length >= 2 ? searchResults ?? [] : data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[hsl(218,35%,14%)] transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-white">{baseName}</h1>
            <p className="text-sm text-slate-400">{total} itens cadastrados</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Importar planilha SINAPI real */}
          <button
            onClick={() => sinapiFileRef.current?.click()}
            disabled={importingSinapi}
            className="flex items-center gap-2 px-3 py-2 text-sm text-emerald-300 bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-700/40 rounded-lg transition-colors disabled:opacity-50"
            title="Importar planilha SINAPI oficial (XLSX/CSV) da CAIXA"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {importingSinapi ? "Importando SINAPI..." : "Importar Planilha SINAPI"}
          </button>
          <input
            ref={sinapiFileRef}
            type="file"
            accept=".xlsx,.xls,.csv,.ods"
            className="hidden"
            onChange={handleSinapiFileImport}
          />

          {/* Importar amostra (10 itens hardcoded para demo) */}
          <button
            onClick={() => importItems.mutate({ baseId, items: SINAPI_SAMPLE })}
            disabled={importItems.isPending}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 bg-[hsl(218,35%,14%)] hover:bg-[hsl(218,35%,18%)] border border-[hsl(218,35%,22%)] rounded-lg transition-colors disabled:opacity-50"
            title="Carrega 10 itens de exemplo SINAPI para demonstração"
          >
            <Download className="w-4 h-4" />
            {importItems.isPending ? "Carregando..." : "Amostra Demo"}
          </button>

          <button
            onClick={() => setShowAddItem(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Item
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código ou descrição..."
          className="w-full bg-[hsl(218,35%,10%)] border border-[hsl(218,35%,18%)] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-[hsl(218,35%,10%)] border border-[hsl(218,35%,18%)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(218,35%,18%)]">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide w-24">
                  Código
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Descrição
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide w-20">
                  Unid.
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide w-36">
                  Preço Unit.
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide w-32">
                  Categoria
                </th>
                <th className="w-16 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(218,35%,14%)]">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3">
                      <div className="h-4 bg-[hsl(218,35%,16%)] rounded w-16" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 bg-[hsl(218,35%,16%)] rounded w-full" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 bg-[hsl(218,35%,16%)] rounded w-8" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 bg-[hsl(218,35%,16%)] rounded w-20 ml-auto" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 bg-[hsl(218,35%,16%)] rounded w-20" />
                    </td>
                    <td className="px-4 py-3" />
                  </tr>
                ))
              ) : displayItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <Database className="w-8 h-8 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">
                      {search.length >= 2
                        ? "Nenhum item encontrado para a busca"
                        : "Nenhum item cadastrado. Adicione itens ou importe uma amostra SINAPI."}
                    </p>
                  </td>
                </tr>
              ) : (
                displayItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[hsl(218,35%,12%)] transition-colors group"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">
                      {item.code}
                    </td>
                    <td className="px-4 py-3 text-white text-sm">
                      {item.description}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{item.unit}</td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-400">
                      {formatBRL(Number(item.unitPrice))}
                    </td>
                    <td className="px-4 py-3">
                      {item.category ? (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <Tag className="w-3 h-3" />
                          {item.category}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteItem.mutate({ id: item.id })}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                        title="Remover item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!search && total > LIMIT && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[hsl(218,35%,18%)]">
            <p className="text-xs text-slate-500">
              Página {currentPage} de {totalPages} — {total} itens
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOffset(Math.max(0, offset - LIMIT))}
                disabled={offset === 0}
                className="px-3 py-1.5 text-xs text-slate-400 bg-[hsl(218,35%,14%)] border border-[hsl(218,35%,22%)] rounded-lg hover:text-white disabled:opacity-40 transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setOffset(offset + LIMIT)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 text-xs text-slate-400 bg-[hsl(218,35%,14%)] border border-[hsl(218,35%,22%)] rounded-lg hover:text-white disabled:opacity-40 transition-colors"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {showAddItem && (
        <AdicionarItemModal baseId={baseId} onClose={() => setShowAddItem(false)} />
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BasesContent() {
  const [showNovaBase, setShowNovaBase] = useState(false);
  const [selectedBase, setSelectedBase] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const utils = trpc.useUtils();
  const { data: bases, isLoading } = trpc.basePreco.list.useQuery();

  const deleteBase = trpc.basePreco.delete.useMutation({
    onSuccess: () => {
      utils.basePreco.list.invalidate();
      toast.success("Base excluída");
    },
    onError: (err) => toast.error(err.message),
  });

  // If a base is selected, show its detail view
  if (selectedBase) {
    return (
      <BaseDetail
        baseId={selectedBase.id}
        baseName={selectedBase.name}
        onBack={() => setSelectedBase(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            Bases de Preços
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Gerencie suas bases próprias de referência de preços
          </p>
        </div>
        <button
          onClick={() => setShowNovaBase(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Base
        </button>
      </div>

      {/* Bases Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-[hsl(218,35%,10%)] border border-[hsl(218,35%,18%)] rounded-xl p-5 space-y-3"
            >
              <div className="h-5 bg-[hsl(218,35%,16%)] rounded w-3/4" />
              <div className="h-4 bg-[hsl(218,35%,16%)] rounded w-1/2" />
              <div className="h-4 bg-[hsl(218,35%,16%)] rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : !bases || bases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-[hsl(218,35%,13%)] rounded-2xl flex items-center justify-center mb-4">
            <Database className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            Nenhuma base cadastrada
          </h3>
          <p className="text-slate-400 text-sm max-w-sm mb-6">
            Crie sua primeira base de preços para organizar insumos e referenciais de custo.
          </p>
          <button
            onClick={() => setShowNovaBase(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Base
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bases.map((base) => (
            <div
              key={base.id}
              className="bg-[hsl(218,35%,10%)] border border-[hsl(218,35%,18%)] rounded-xl p-5 hover:border-[hsl(218,35%,26%)] transition-all group"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate">{base.name}</h3>
                  {base.description && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {base.description}
                    </p>
                  )}
                </div>
                <SourceBadge source={base.source} />
              </div>

              {/* Meta */}
              <div className="space-y-1.5 mb-4">
                {base.region && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Tag className="w-3 h-3" />
                    <span>{base.region}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Database className="w-3 h-3" />
                  <span>{base._count.items} itens</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      base.isActive
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-slate-500/15 text-slate-400"
                    )}
                  >
                    {base.isActive ? "Ativa" : "Inativa"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedBase({ id: base.id, name: base.name })}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-[hsl(218,35%,14%)] hover:bg-[hsl(218,35%,18%)] border border-[hsl(218,35%,22%)] rounded-lg transition-colors"
                >
                  Ver Itens
                  <ChevronRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    if (
                      confirm(`Excluir a base "${base.name}"? Todos os itens serão removidos.`)
                    ) {
                      deleteBase.mutate({ id: base.id });
                    }
                  }}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  title="Excluir base"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNovaBase && <NovaBaseModal onClose={() => setShowNovaBase(false)} />}
    </div>
  );
}
