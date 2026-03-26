"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { User, Building2, Bell, Shield, Mail, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "perfil", label: "Meu Perfil", icon: User },
  { id: "empresa", label: "Empresa", icon: Building2 },
  { id: "notificacoes", label: "Notificações", icon: Bell },
  { id: "usuarios", label: "Usuários", icon: Shield },
] as const;

type TabId = typeof TABS[number]["id"];

function EmpresaTab() {
  const { data: company } = trpc.user.getCompany.useQuery();
  const utils = trpc.useUtils();
  const [form, setForm] = useState({ name: "", cnpj: "", address: "", phone: "", email: "", segments: "" });

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name ?? "",
        cnpj: company.cnpj ?? "",
        address: company.address ?? "",
        phone: company.phone ?? "",
        email: company.email ?? "",
        segments: company.segments?.join(", ") ?? "",
      });
    }
  }, [company]);

  const updateCompany = trpc.user.updateCompany.useMutation({
    onSuccess: () => { utils.user.getCompany.invalidate(); toast.success("Empresa atualizada"); },
    onError: (err) => toast.error(err.message),
  });

  const handleSave = () => {
    updateCompany.mutate({
      name: form.name,
      cnpj: form.cnpj,
      address: form.address,
      phone: form.phone,
      email: form.email,
      segments: form.segments.split(",").map(s => s.trim()).filter(Boolean),
    });
  };

  const field = (label: string, key: keyof typeof form, type = "text") => (
    <div key={key}>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
    </div>
  );

  return (
    <div className="space-y-5 max-w-md">
      <h2 className="font-heading font-semibold">Dados da Empresa</h2>
      {field("Nome da Empresa", "name")}
      {field("CNPJ", "cnpj")}
      {field("Endereço", "address")}
      {field("Telefone", "phone")}
      {field("E-mail Corporativo", "email", "email")}
      <div>
        <label className="block text-sm font-medium mb-1.5">Segmentos (separados por vírgula)</label>
        <input type="text" value={form.segments} onChange={e => setForm(f => ({ ...f, segments: e.target.value }))}
          placeholder="Obras Civis, Pavimentação, Saneamento"
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>
      <button onClick={handleSave} disabled={updateCompany.isPending}
        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
        {updateCompany.isPending ? "Salvando..." : "Salvar alterações"}
      </button>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={cn("w-10 h-5 rounded-full transition-colors flex items-center px-0.5 flex-shrink-0",
        checked ? "bg-primary" : "bg-muted")}>
      <span className={cn("w-4 h-4 rounded-full bg-white shadow transition-transform",
        checked ? "translate-x-5" : "translate-x-0")} />
    </button>
  );
}

function NotificacoesTab({ me }: { me: { emailNotifications: boolean } | null | undefined }) {
  const utils = trpc.useUtils();
  const [emailOn, setEmailOn] = useState(me?.emailNotifications ?? true);

  useEffect(() => {
    if (me !== undefined && me !== null) setEmailOn(me.emailNotifications);
  }, [me]);

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => { utils.user.me.invalidate(); toast.success("Preferências salvas"); },
    onError: (err) => toast.error(err.message),
  });

  const items = [
    {
      icon: Mail,
      title: "Alertas por e-mail",
      desc: "Receba um e-mail quando documentos estiverem vencendo ou um agente RPA finalizar a busca.",
      key: "email" as const,
      value: emailOn,
      onChange: setEmailOn,
      persisted: true,
    },
    {
      icon: AlertTriangle,
      title: "Documentos vencendo (sistema)",
      desc: "Notificações internas no painel quando certidões se aproximam do vencimento.",
      key: "sysDoc" as const,
      value: true,
      onChange: () => {},
      persisted: false,
    },
    {
      icon: CheckCircle2,
      title: "Conclusão de agentes RPA",
      desc: "Notificação interna ao finalizar uma execução de agente automatizado.",
      key: "sysRpa" as const,
      value: true,
      onChange: () => {},
      persisted: false,
    },
  ];

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <h2 className="font-heading font-semibold">Notificações</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Configure como e quando deseja ser notificado sobre eventos do sistema.
        </p>
      </div>

      <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
        {items.map(({ icon: Icon, title, desc, key, value, onChange, persisted }) => (
          <div key={key} className="flex items-start gap-4 p-4 bg-card hover:bg-muted/30 transition-colors">
            <div className="mt-0.5 p-2 rounded-lg bg-primary/10">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              {!persisted && (
                <span className="text-[10px] text-muted-foreground/60 mt-1 block">Sempre ativo</span>
              )}
            </div>
            <Toggle checked={value} onChange={persisted ? onChange : () => {}} />
          </div>
        ))}
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          Para receber e-mails, o administrador do sistema precisa configurar a variável
          <code className="mx-1 bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded text-[11px]">RESEND_API_KEY</code>
          nas configurações do servidor.
        </p>
      </div>

      <button
        onClick={() => updateProfile.mutate({ emailNotifications: emailOn })}
        disabled={updateProfile.isPending}
        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
        {updateProfile.isPending ? "Salvando..." : "Salvar preferências"}
      </button>
    </div>
  );
}

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
          {activeTab === "perfil" && (
            <div className="space-y-5 max-w-md">
              <h2 className="font-heading font-semibold">Meu Perfil</h2>
              {!me ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-16 w-16 rounded-full bg-muted" />
                  <div className="h-4 w-48 bg-muted rounded" />
                  <div className="h-4 w-64 bg-muted rounded" />
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          )}

          {activeTab === "empresa" && <EmpresaTab />}

          {activeTab === "notificacoes" && (
            <NotificacoesTab me={me} />
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
