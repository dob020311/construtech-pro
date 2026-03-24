import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import {
  MessageSquare,
  CheckSquare,
  Phone,
  Mail,
  CalendarDays,
  AlertCircle,
  ArrowRight,
  Upload,
  Zap,
} from "lucide-react";

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: Date;
  user: { id: string; name: string; avatar: string | null };
  licitacao: { id: string; number: string; object: string } | null;
}

interface RecentActivitiesProps {
  activities: Activity[];
  loading: boolean;
}

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  NOTE: MessageSquare,
  TASK: CheckSquare,
  CALL: Phone,
  EMAIL: Mail,
  MEETING: CalendarDays,
  DEADLINE: AlertCircle,
  STATUS_CHANGE: ArrowRight,
  DOCUMENT_UPLOAD: Upload,
  SYSTEM: Zap,
};

const ACTIVITY_COLORS: Record<string, string> = {
  NOTE: "bg-blue-50 dark:bg-blue-900/20 text-blue-600",
  TASK: "bg-green-50 dark:bg-green-900/20 text-green-600",
  CALL: "bg-purple-50 dark:bg-purple-900/20 text-purple-600",
  EMAIL: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600",
  MEETING: "bg-amber-50 dark:bg-amber-900/20 text-amber-600",
  DEADLINE: "bg-red-50 dark:bg-red-900/20 text-red-600",
  STATUS_CHANGE: "bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600",
  DOCUMENT_UPLOAD: "bg-orange-50 dark:bg-orange-900/20 text-orange-600",
  SYSTEM: "bg-slate-50 dark:bg-slate-900/20 text-slate-600",
};

export function RecentActivities({ activities, loading }: RecentActivitiesProps) {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="skeleton h-5 w-40 rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="skeleton w-8 h-8 rounded-lg flex-shrink-0" />
              <div className="flex-1">
                <div className="skeleton h-4 w-3/4 rounded mb-1" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading font-semibold text-base">Atividades Recentes</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Últimas interações da equipe</p>
        </div>
        <Link href="/crm/atividades" className="text-xs text-primary font-medium hover:underline">
          Ver todas
        </Link>
      </div>

      {activities.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground text-sm">
          <Zap className="w-8 h-8 mx-auto mb-2 opacity-40" />
          Nenhuma atividade recente
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => {
            const Icon = ACTIVITY_ICONS[activity.type] ?? Zap;
            const colorClass = ACTIVITY_COLORS[activity.type] ?? ACTIVITY_COLORS.SYSTEM;
            const initials = activity.user.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight">{activity.title}</p>
                      {activity.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {activity.description}
                        </p>
                      )}
                      {activity.licitacao && (
                        <Link
                          href={`/licitacoes/${activity.licitacao.id}`}
                          className="text-xs text-primary font-medium hover:underline truncate block mt-0.5"
                        >
                          {activity.licitacao.number} — {activity.licitacao.object}
                        </Link>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                      {formatDateTime(activity.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-[10px] font-bold">
                      {initials}
                    </div>
                    <p className="text-xs text-muted-foreground">{activity.user.name}</p>
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
