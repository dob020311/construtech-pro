"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  Plus,
  Search,
  Filter,
  LayoutList,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Calendar,
  Building2,
} from "lucide-react";
import { cn, formatCurrency, formatDate, STATUS_COLORS, STATUS_LABELS, MODALITY_LABELS } from "@/lib/utils";
import Link from "next/link";
import { LicitacaoStatus, Modality } from "@prisma/client";
import { CreateLicitacaoDialog } from "./create-licitacao-dialog";

export function LicitacoesContent() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LicitacaoStatus | undefined>();
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showCreate, setShowCreate] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search properly with useEffect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset to page 1 on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = trpc.licitacao.list.useQuery({
    page,
    limit: 20,
    status: statusFilter,
    search: debouncedSearch || undefined,
  });

  const statusFilters = [
    { label: "Todas", value: undefined },
    { label: "Ativas", value: undefined, group: true },
    { label: "Identificada", value: "IDENTIFIED" as LicitacaoStatus },
    { label: "Analisando", value: "ANALYZING" as LicitacaoStatus },
    { label: "GO", value: "GO" as LicitacaoStatus },
    { label: "Orçando", value: "BUDGETING" as LicitacaoStatus },
    { label: "Proposta Enviada", value: "PROPOSAL_SENT" as LicitacaoStatus },
    { label: "Ganhou", value: "WON" as LicitacaoStatus },
    { label: "Perdeu", value: "LOST" as LicitacaoStatus },
  ].filter((f) => !f.group);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Licitações</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {data?.total ?? 0} licitações no sistema
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nova Licitação
        </button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por número, objeto, órgão..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Status filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {statusFilters.map((filter) => (
            <button
              key={filter.label}
              onClick={() => {
                setStatusFilter(filter.value);
                setPage(1);
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                statusFilter === filter.value
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === "list" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === "grid" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="skeleton h-4 w-32 rounded" />
                <div className="skeleton h-4 flex-1 rounded" />
                <div className="skeleton h-6 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === "list" ? (
        <LicitacoesTable items={data?.items ?? []} />
      ) : (
        <LicitacoesGrid items={data?.items ?? []} />
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Mostrando {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} de {data.total}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {(() => {
              const total = data.pages;
              const window = 2; // pages each side of current
              const start = Math.max(1, page - window);
              const end = Math.min(total, page + window);
              const pages = [];
              if (start > 1) pages.push(1, start > 2 ? "…" : null);
              for (let p = start; p <= end; p++) pages.push(p);
              if (end < total) pages.push(end < total - 1 ? "…" : null, total);
              return pages.filter(Boolean).map((p, i) =>
                p === "…" ? (
                  <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-muted-foreground text-sm">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                      page === p ? "bg-primary text-white" : "hover:bg-muted"
                    )}
                  >
                    {p}
                  </button>
                )
              );
            })()}
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === data.pages}
              className="p-2 rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <CreateLicitacaoDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}

function LicitacoesTable({
  items,
}: {
  items: Array<{
    id: string;
    number: string;
    modality: Modality;
    object: string;
    organ: string;
    status: LicitacaoStatus;
    estimatedValue: unknown;
    closingDate: Date | null;
    state: string | null;
    assignments: Array<{ user: { id: string; name: string; avatar: string | null } }>;
  }>;
}) {
  if (items.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl py-16 text-center text-muted-foreground">
        <Filter className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">Nenhuma licitação encontrada</p>
        <p className="text-sm mt-1">Tente ajustar os filtros ou criar uma nova licitação</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Número / Modalidade
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Objeto
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Órgão
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Status
            </th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Valor Estimado
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Prazo
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-muted/20 transition-colors group">
              <td className="px-4 py-3.5">
                <p className="text-sm font-mono font-medium text-primary">{item.number}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {MODALITY_LABELS[item.modality] ?? item.modality}
                </p>
              </td>
              <td className="px-4 py-3.5 max-w-[300px]">
                <p className="text-sm font-medium truncate">{item.object}</p>
              </td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm truncate max-w-[180px]">{item.organ}</p>
                </div>
                {item.state && (
                  <p className="text-xs text-muted-foreground mt-0.5">{item.state}</p>
                )}
              </td>
              <td className="px-4 py-3.5">
                <span
                  className={cn(
                    "status-badge",
                    STATUS_COLORS[item.status]
                  )}
                >
                  {STATUS_LABELS[item.status]}
                </span>
              </td>
              <td className="px-4 py-3.5 text-right">
                <p className="text-sm font-mono font-medium">
                  {item.estimatedValue ? formatCurrency(Number(item.estimatedValue)) : "-"}
                </p>
              </td>
              <td className="px-4 py-3.5">
                {item.closingDate ? (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{formatDate(item.closingDate)}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </td>
              <td className="px-4 py-3.5">
                <Link
                  href={`/licitacoes/${item.id}`}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LicitacoesGrid({
  items,
}: {
  items: Array<{
    id: string;
    number: string;
    modality: Modality;
    object: string;
    organ: string;
    status: LicitacaoStatus;
    estimatedValue: unknown;
    closingDate: Date | null;
    state: string | null;
    assignments: Array<{ user: { id: string; name: string; avatar: string | null } }>;
  }>;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/licitacoes/${item.id}`}
          className="bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-primary/30 transition-all group"
        >
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-mono font-medium text-primary">{item.number}</p>
            <span className={cn("status-badge", STATUS_COLORS[item.status])}>
              {STATUS_LABELS[item.status]}
            </span>
          </div>
          <p className="text-sm font-medium leading-snug line-clamp-2 mb-3">{item.object}</p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{item.organ}</span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {MODALITY_LABELS[item.modality]}
            </span>
            {item.estimatedValue != null && (
              <span className="text-sm font-mono font-semibold">
                {formatCurrency(Number(item.estimatedValue))}
              </span>
            )}
          </div>
          {item.closingDate && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(item.closingDate)}</span>
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
