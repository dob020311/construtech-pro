"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Building2, Search, X, Plus, ExternalLink, Users, FileText } from "lucide-react";
import { toast } from "sonner";

export function EmpresasContent() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = trpc.crm.listOrganizations.useQuery({ page, limit: 20, search: debouncedSearch || undefined });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Órgãos e Empresas</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{data?.total ?? 0} organizações cadastradas</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" /> Nova Organização
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Buscar organizações..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5 text-muted-foreground" /></button>}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center text-muted-foreground">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-foreground text-sm">Nenhuma organização encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data?.items.map((org) => (
            <div key={org.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{org.name}</p>
                    {org.type && <p className="text-xs text-muted-foreground">{org.type}</p>}
                  </div>
                </div>
                {org.portalUrl && (
                  <a href={org.portalUrl} target="_blank" rel="noopener noreferrer"
                    className="p-1 text-muted-foreground hover:text-primary transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                {org.cnpj && <span>{org.cnpj}</span>}
                {(org.city || org.state) && <span>{[org.city, org.state].filter(Boolean).join("/")}</span>}
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{org._count.contacts} contatos</span>
                <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{org._count.licitacoes} licit.</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">{data.total} organizações</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-border rounded-lg disabled:opacity-40 hover:bg-muted">Anterior</button>
            <span className="px-3 py-1.5 text-muted-foreground">{page} / {data.pages}</span>
            <button disabled={page === data.pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-border rounded-lg disabled:opacity-40 hover:bg-muted">Próximo</button>
          </div>
        </div>
      )}

      {showModal && <NovaOrganizacaoModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

function NovaOrganizacaoModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: "", cnpj: "", type: "", state: "", city: "", portalUrl: "" });
  const [error, setError] = useState("");
  const utils = trpc.useUtils();

  const create = trpc.crm.createOrganization.useMutation({
    onSuccess: () => { utils.crm.listOrganizations.invalidate(); onClose(); toast.success("Organização criada"); },
    onError: (err) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Nome é obrigatório"); return; }
    create.mutate({ ...form, portalUrl: form.portalUrl || undefined });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-heading font-bold mb-5">Nova Organização</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: "Nome *", key: "name", placeholder: "Nome do órgão/empresa" },
            { label: "CNPJ", key: "cnpj", placeholder: "00.000.000/0001-00" },
            { label: "Tipo", key: "type", placeholder: "Federal, Estadual, Municipal" },
            { label: "Estado", key: "state", placeholder: "SP" },
            { label: "Cidade", key: "city", placeholder: "São Paulo" },
            { label: "Portal de Licitações", key: "portalUrl", placeholder: "https://..." },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1.5">{label}</label>
              <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
          ))}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted">Cancelar</button>
            <button type="submit" disabled={create.isPending} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              {create.isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
