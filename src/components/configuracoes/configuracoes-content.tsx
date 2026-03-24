"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { User, Building2, Bell, Shield, Palette } from "lucide-react";
import { toast } from "sonner";

const TABS = [
  { id: "perfil", label: "Meu Perfil", icon: User },
  { id: "empresa", label: "Empresa", icon: Building2 },
  { id: "notificacoes", label: "Notificações", icon: Bell },
  { id: "usuarios", label: "Usuários", icon: Shield },
] as const;

type TabId = typeof TABS[number]["id"];

export function ConfiguracoesContent() {
  const [activeTab, setActiveTab] = useState<TabId>("perfil");
  const { data: me } = trpc.user.me.useQuery();
  const { data: users } = trpc.user.listUsers.useQuery();

  const [name, setName] = useState("");
  const utils = trpc.useUtils();

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => { utils.user.me.invalidate(); toast.success("Perfil atualizado"); },
    onError: (err) => toast.error(err.message),
  });

  const ROLE_LABELS: Record<string, string> = {
    ADMIN: "Administrador", MANAGER: "Gerente", BUDGETEER: "Orçamentista", ANALYST: "Analista",
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-heading font-bold">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Gerencie sua conta e preferências do sistema</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <nav className="w-48 flex-shrink-0 space-y-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === id ? "bg-primary text-white font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 bg-card border border-border rounded-xl p-6">
          {activeTab === "perfil" && me && (
            <div className="space-y-5 max-w-md">
              <h2 className="font-heading font-semibold">Meu Perfil</h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                  {me.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{me.name}</p>
                  <p className="text-sm text-muted-foreground">{me.email}</p>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-1 inline-block">
                    {ROLE_LABELS[me.role] ?? me.role}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Nome</label>
                <input type="text" defaultValue={me.name} onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">E-mail</label>
                <input type="email" defaultValue={me.email} disabled
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm opacity-60 cursor-not-allowed" />
              </div>
              <button onClick={() => { if (name) updateProfile.mutate({ name }); }}
                disabled={updateProfile.isPending}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
                {updateProfile.isPending ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          )}

          {activeTab === "empresa" && (
            <div className="space-y-4 max-w-md">
              <h2 className="font-heading font-semibold">Dados da Empresa</h2>
              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                As configurações de empresa serão disponibilizadas em uma próxima versão.
              </div>
            </div>
          )}

          {activeTab === "notificacoes" && (
            <div className="space-y-4 max-w-md">
              <h2 className="font-heading font-semibold">Notificações</h2>
              {[
                { label: "Documentos prestes a vencer (30 dias)", defaultChecked: true },
                { label: "Novos editais capturados pelo RPA", defaultChecked: true },
                { label: "Prazos de licitações se aproximando", defaultChecked: true },
                { label: "Atualizações de status pelo time", defaultChecked: false },
              ].map(({ label, defaultChecked }) => (
                <label key={label} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" defaultChecked={defaultChecked}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30" />
                  <span className="text-sm group-hover:text-foreground transition-colors">{label}</span>
                </label>
              ))}
              <button onClick={() => toast.success("Preferências salvas")}
                className="mt-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
                Salvar preferências
              </button>
            </div>
          )}

          {activeTab === "usuarios" && (
            <div className="space-y-4">
              <h2 className="font-heading font-semibold">Usuários do Sistema</h2>
              <div className="divide-y divide-border">
                {users?.map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
