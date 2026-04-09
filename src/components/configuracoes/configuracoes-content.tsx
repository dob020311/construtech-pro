"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { User, Building2, Bell, Shield, Mail, AlertTriangle, CheckCircle2, CreditCard, Zap, Crown, Star, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PLANS, formatPrice, type PlanKey } from "@/lib/stripe";
import { useSession } from "next-auth/react";

const TABS = [
  { id: "perfil", label: "Meu Perfil", icon: User },
  { id: "empresa", label: "Empresa", icon: Building2 },
  { id: "notificacoes", label: "Notificações", icon: Bell },
  { id: "billing", label: "Plano & Billing", icon: CreditCard },
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

const PLAN_ICONS: Record<string, React.ElementType> = {
  FREE: Zap, STARTER: Star, PRO: Crown, ENTERPRISE: Shield,
};
const PLAN_COLORS: Record<string, string> = {
  FREE: "text-muted-foreground", STARTER: "text-blue-600", PRO: "text-purple-600", ENTERPRISE: "text-amber-600",
};
const PLAN_BG: Record<string, string> = {
  FREE: "bg-muted", STARTER: "bg-blue-50 dark:bg-blue-900/20", PRO: "bg-purple-50 dark:bg-purple-900/20", ENTERPRISE: "bg-amber-50 dark:bg-amber-900/20",
};

function UsageBar({ current, limit, label }: { current: number; limit: number; label: string }) {
  const pct = limit === -1 ? 0 : Math.min(100, Math.round((current / limit) * 100));
  const isNearLimit = limit !== -1 && pct >= 80;
  const isAtLimit = limit !== -1 && current >= limit;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-medium", isAtLimit ? "text-red-500" : isNearLimit ? "text-amber-500" : "text-foreground")}>
          {current} / {limit === -1 ? "∞" : limit}
        </span>
      </div>
      {limit !== -1 && (
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", isAtLimit ? "bg-red-500" : isNearLimit ? "bg-amber-500" : "bg-primary")}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

function BillingTab({ currentPlan }: { currentPlan?: string }) {
  const [loading, setLoading] = useState<PlanKey | null>(null);
  const { data: planUsage } = trpc.user.getPlanUsage.useQuery();
  const active = (planUsage?.planKey ?? currentPlan ?? "FREE") as PlanKey;

  const handleUpgrade = async (planKey: PlanKey) => {
    const plan = PLANS[planKey];
    if (!plan.priceId) {
      if (planKey === "ENTERPRISE") {
        toast.info("Entre em contato: contato@construtech.pro");
      } else {
        toast.error("Plano não configurado. Configure STRIPE_PRICE_ID nas variáveis de ambiente.");
      }
      return;
    }
    setLoading(planKey);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error ?? "Erro ao iniciar checkout");
      }
    } catch {
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="font-heading font-semibold">Plano & Billing</h2>
        <p className="text-xs text-muted-foreground mt-1">Gerencie sua assinatura e recursos disponíveis.</p>
      </div>

      {/* Current plan badge */}
      <div className={cn("flex items-center gap-3 p-4 rounded-xl border", PLAN_BG[active])}>
        {(() => { const Icon = PLAN_ICONS[active] ?? Zap; return <Icon className={cn("w-5 h-5", PLAN_COLORS[active])} />; })()}
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            Plano atual: <span className={PLAN_COLORS[active]}>{PLANS[active].name}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {PLANS[active].price === 0 ? "Grátis para sempre" : formatPrice(PLANS[active].price) + "/mês"}
          </p>
        </div>
        {planUsage?.planExpiresAt && (
          <span className="text-xs text-amber-600 font-medium">
            Expira {new Date(planUsage.planExpiresAt).toLocaleDateString("pt-BR")}
          </span>
        )}
      </div>

      {/* Usage meters */}
      {planUsage?.usage && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <p className="text-sm font-semibold">Uso atual</p>
          <UsageBar label="Licitações" current={planUsage.usage.licitacoes.current} limit={planUsage.usage.licitacoes.limit} />
          <UsageBar label="Usuários" current={planUsage.usage.users.current} limit={planUsage.usage.users.limit} />
          <UsageBar label="Agentes RPA" current={planUsage.usage.rpaJobs.current} limit={planUsage.usage.rpaJobs.limit} />
          <UsageBar label="Documentos" current={planUsage.usage.documents.current} limit={planUsage.usage.documents.limit} />
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(Object.entries(PLANS) as [PlanKey, typeof PLANS[PlanKey]][]).filter(([k]) => k !== "FREE").map(([key, plan]) => {
          const isCurrent = active === key;
          const Icon = PLAN_ICONS[key] ?? Zap;
          return (
            <div key={key} className={cn(
              "rounded-xl border p-5 flex flex-col gap-4 transition-all",
              isCurrent ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-border bg-card hover:border-primary/50"
            )}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("p-2 rounded-lg", PLAN_BG[key])}>
                    <Icon className={cn("w-4 h-4", PLAN_COLORS[key])} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{plan.name}</p>
                    <p className={cn("text-xs font-medium", PLAN_COLORS[key])}>
                      {formatPrice(plan.price)}{plan.price > 0 ? "/mês" : ""}
                    </p>
                  </div>
                </div>
                {isCurrent && (
                  <span className="text-[10px] font-semibold bg-primary text-white px-2 py-0.5 rounded-full">Ativo</span>
                )}
              </div>

              <ul className="space-y-1.5 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(key)}
                disabled={isCurrent || loading !== null}
                className={cn(
                  "w-full py-2 rounded-lg text-sm font-medium transition-colors",
                  isCurrent
                    ? "bg-primary/10 text-primary cursor-default"
                    : "bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                )}>
                {loading === key ? "Aguarde..." : isCurrent ? "Plano Atual" : key === "ENTERPRISE" ? "Falar com vendas" : `Assinar ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Pagamentos processados com segurança via Stripe. Cancele a qualquer momento sem multa.
      </p>
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

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador", MANAGER: "Gerente", BUDGETEER: "Orçamentista", ANALYST: "Analista",
};

function NovoUsuarioModal({ onClose }: { onClose: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "ANALYST" as "ADMIN" | "MANAGER" | "BUDGETEER" | "ANALYST" });
  const [error, setError] = useState("");

  const create = trpc.user.createUser.useMutation({
    onSuccess: () => { utils.user.listUsers.invalidate(); onClose(); toast.success("Usuário criado com sucesso"); },
    onError: (err) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Nome é obrigatório"); return; }
    if (!form.email.trim()) { setError("E-mail é obrigatório"); return; }
    if (form.password.length < 6) { setError("Senha deve ter pelo menos 6 caracteres"); return; }
    create.mutate(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-heading font-bold">Novo Usuário</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Nome *</label>
            <input autoFocus type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nome completo"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">E-mail *</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="usuario@empresa.com"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Senha inicial *</label>
            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Perfil *</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as typeof form.role }))}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="ANALYST">Analista</option>
              <option value="BUDGETEER">Orçamentista</option>
              <option value="MANAGER">Gerente</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={create.isPending}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {create.isPending ? "Criando..." : "Criar Usuário"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UsuariosTab({ meId }: { meId: string }) {
  const utils = trpc.useUtils();
  const { data: users, isLoading } = trpc.user.listUsers.useQuery();
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const deleteUser = trpc.user.deleteUser.useMutation({
    onSuccess: () => { utils.user.listUsers.invalidate(); setConfirmDelete(null); toast.success("Usuário removido"); },
    onError: (err) => { toast.error(err.message); setConfirmDelete(null); },
  });

  return (
    <div className="space-y-4">
      {showModal && <NovoUsuarioModal onClose={() => setShowModal(false)} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-semibold">Usuários do Sistema</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{users?.length ?? 0} usuários cadastrados</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Novo Usuário
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
        </div>
      ) : (
        <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
          {users?.map((u) => {
            const isSelf = u.id === meId;
            return (
              <div key={u.id} className="flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{u.name}</p>
                      {isSelf && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Você</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                  {!isSelf && (
                    confirmDelete === u.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-destructive">Confirmar?</span>
                        <button onClick={() => deleteUser.mutate({ userId: u.id })} disabled={deleteUser.isPending}
                          className="text-xs px-2 py-1 bg-destructive text-white rounded-lg hover:bg-destructive/90 disabled:opacity-50">
                          {deleteUser.isPending ? "..." : "Sim"}
                        </button>
                        <button onClick={() => setConfirmDelete(null)}
                          className="text-xs px-2 py-1 border border-border rounded-lg hover:bg-muted">
                          Não
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(u.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ConfiguracoesContent() {
  const [activeTab, setActiveTab] = useState<TabId>("perfil");
  const { data: me } = trpc.user.me.useQuery();
  const { update: updateSession } = useSession();

  const [name, setName] = useState("");
  const utils = trpc.useUtils();

  useEffect(() => {
    if (me?.name) setName(me.name);
  }, [me?.name]);

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: async (data) => {
      utils.user.me.invalidate();
      await updateSession({ name: data.name });
      toast.success("Perfil atualizado");
    },
    onError: (err) => toast.error(err.message),
  });

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
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">E-mail</label>
                    <input type="email" value={me.email} disabled
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm opacity-60 cursor-not-allowed" />
                  </div>
                  <button onClick={() => { if (name.trim()) updateProfile.mutate({ name: name.trim() }); }}
                    disabled={updateProfile.isPending || !name.trim()}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
                    {updateProfile.isPending ? "Salvando..." : "Salvar alterações"}
                  </button>
                </>
              )}
            </div>
          )}

          {activeTab === "empresa" && <EmpresaTab />}

          {activeTab === "notificacoes" && <NotificacoesTab me={me} />}

          {activeTab === "billing" && <BillingTab currentPlan={me?.company?.plan} />}

          {activeTab === "usuarios" && <UsuariosTab meId={me?.id ?? ""} />}
        </div>
      </div>
    </div>
  );
}
