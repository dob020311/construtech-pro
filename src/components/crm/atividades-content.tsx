"use client";

import { trpc } from "@/lib/trpc";
import { Activity, FileText, CheckCircle2, Phone, Mail, Calendar, Tag } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import Link from "next/link";

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  NOTE: { label: "Nota", icon: <FileText className="w-3.5 h-3.5" />, color: "bg-slate-100 text-slate-600" },
  TASK: { label: "Tarefa", icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "bg-blue-100 text-blue-600" },
  CALL: { label: "Ligação", icon: <Phone className="w-3.5 h-3.5" />, color: "bg-green-100 text-green-600" },
  EMAIL: { label: "E-mail", icon: <Mail className="w-3.5 h-3.5" />, color: "bg-purple-100 text-purple-600" },
  MEETING: { label: "Reunião", icon: <Calendar className="w-3.5 h-3.5" />, color: "bg-amber-100 text-amber-600" },
  DEADLINE: { label: "Prazo", icon: <Calendar className="w-3.5 h-3.5" />, color: "bg-red-100 text-red-600" },
  STATUS_CHANGE: { label: "Status", icon: <Tag className="w-3.5 h-3.5" />, color: "bg-indigo-100 text-indigo-600" },
  SYSTEM: { label: "Sistema", icon: <Activity className="w-3.5 h-3.5" />, color: "bg-gray-100 text-gray-500" },
};

export function AtividadesContent() {
  const { data, isLoading } = trpc.crm.listActivities.useQuery({ page: 1, limit: 50 });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-heading font-bold">Atividades</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Timeline completa de atividades da equipe</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center text-muted-foreground">
          <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-foreground text-sm">Nenhuma atividade registrada</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          {data?.items.map((act) => {
            const cfg = TYPE_CONFIG[act.type] ?? TYPE_CONFIG.SYSTEM;
            return (
              <div key={act.id} className="flex items-start gap-3 px-4 py-3.5 hover:bg-accent/20 transition-colors">
                <div className={cn("w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5", cfg.color)}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{act.title}</p>
                    <span className="text-xs text-muted-foreground">{cfg.label}</span>
                  </div>
                  {act.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{act.description}</p>}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{act.user.name}</span>
                    {act.licitacao && (
                      <Link href={`/licitacoes/${act.licitacao.id}`} className="text-primary hover:underline truncate max-w-[200px]">
                        {act.licitacao.number}
                      </Link>
                    )}
                    <span>{formatDate(act.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
