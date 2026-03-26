"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Users, Search, X, Plus, Mail, Phone, Building2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function ContatosContent() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const utils = trpc.useUtils();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = trpc.crm.listContacts.useQuery({ page, limit: 20, search: debouncedSearch || undefined });

  const deleteContact = trpc.crm.deleteContact.useMutation({
    onSuccess: () => { utils.crm.listContacts.invalidate(); setConfirmDelete(null); toast.success("Contato removido"); },
    onError: (err) => { toast.error(err.message); setConfirmDelete(null); },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Contatos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{data?.total ?? 0} contatos cadastrados</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" /> Novo Contato
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Buscar contatos..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5 text-muted-foreground" /></button>}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-foreground text-sm">Nenhum contato encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {data?.items.map((c) => (
            <div key={c.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{c.name}</p>
                  {c.role && <p className="text-xs text-muted-foreground">{c.role}</p>}
                </div>
                {confirmDelete === c.id ? (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[11px] text-destructive">Excluir?</span>
                    <button onClick={() => deleteContact.mutate({ id: c.id })} disabled={deleteContact.isPending}
                      className="text-[11px] px-2 py-0.5 bg-destructive text-white rounded hover:bg-destructive/90 disabled:opacity-50">
                      Sim
                    </button>
                    <button onClick={() => setConfirmDelete(null)}
                      className="text-[11px] px-2 py-0.5 border border-border rounded hover:bg-muted">
                      Não
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(c.id)}
                    className="flex-shrink-0 p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {c.email && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail className="w-3 h-3" />{c.email}</p>}
                {c.phone && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone className="w-3 h-3" />{c.phone}</p>}
                {c.organization && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Building2 className="w-3 h-3" />{c.organization.name}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">{data.total} contatos</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-border rounded-lg disabled:opacity-40 hover:bg-muted">Anterior</button>
            <span className="px-3 py-1.5 text-muted-foreground">{page} / {data.pages}</span>
            <button disabled={page === data.pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-border rounded-lg disabled:opacity-40 hover:bg-muted">Próximo</button>
          </div>
        </div>
      )}

      {showModal && <NovoContatoModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

function NovoContatoModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "" });
  const [error, setError] = useState("");
  const utils = trpc.useUtils();

  const { data: orgs } = trpc.crm.listOrganizations.useQuery({ page: 1, limit: 100 });
  const [organizationId, setOrganizationId] = useState("");

  const create = trpc.crm.createContact.useMutation({
    onSuccess: () => { utils.crm.listContacts.invalidate(); onClose(); toast.success("Contato criado"); },
    onError: (err) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Nome é obrigatório"); return; }
    create.mutate({ ...form, email: form.email || undefined, organizationId: organizationId || undefined });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-heading font-bold mb-5">Novo Contato</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: "Nome *", key: "name", type: "text", placeholder: "Nome completo" },
            { label: "E-mail", key: "email", type: "email", placeholder: "email@exemplo.com" },
            { label: "Telefone", key: "phone", type: "tel", placeholder: "(11) 99999-9999" },
            { label: "Cargo / Função", key: "role", type: "text", placeholder: "Ex: Pregoeiro" },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1.5">{label}</label>
              <input type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium mb-1.5">Organização</label>
            <select value={organizationId} onChange={e => setOrganizationId(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none">
              <option value="">Nenhuma</option>
              {orgs?.items.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
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
