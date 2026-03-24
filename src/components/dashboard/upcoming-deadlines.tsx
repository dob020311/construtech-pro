import { Calendar, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";
import { cn, formatRelativeDate, STATUS_COLORS, STATUS_LABELS } from "@/lib/utils";

interface Deadline {
  id: string;
  number: string;
  object: string;
  organ: string;
  closingDate: Date | null;
  status: string;
}

interface UpcomingDeadlinesProps {
  deadlines: Deadline[];
  loading: boolean;
}

export function UpcomingDeadlines({ deadlines, loading }: UpcomingDeadlinesProps) {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="skeleton h-5 w-40 rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg">
              <div className="skeleton w-4 h-4 rounded-full flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="skeleton h-3 w-full rounded mb-1.5" />
                <div className="skeleton h-3 w-2/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getUrgencyColor = (closingDate: Date | null) => {
    if (!closingDate) return "text-muted-foreground";
    const days = Math.ceil((new Date(closingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days <= 3) return "text-destructive";
    if (days <= 7) return "text-amber-600";
    return "text-muted-foreground";
  };

  const getUrgencyIcon = (closingDate: Date | null) => {
    if (!closingDate) return Clock;
    const days = Math.ceil((new Date(closingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days <= 3) return AlertCircle;
    return Calendar;
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading font-semibold text-base">Próximos Vencimentos</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Editais com prazo próximo</p>
        </div>
        <Link
          href="/licitacoes"
          className="text-xs text-primary font-medium hover:underline"
        >
          Ver todos
        </Link>
      </div>

      {deadlines.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground text-sm">
          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
          Nenhum vencimento próximo
        </div>
      ) : (
        <div className="space-y-2">
          {deadlines.slice(0, 6).map((deadline) => {
            const Icon = getUrgencyIcon(deadline.closingDate);
            const colorClass = getUrgencyColor(deadline.closingDate);

            return (
              <Link
                key={deadline.id}
                href={`/licitacoes/${deadline.id}`}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <Icon className={cn("w-4 h-4 flex-shrink-0 mt-0.5", colorClass)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {deadline.object}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{deadline.organ}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={cn(
                        "text-xs font-medium px-1.5 py-0.5 rounded-full border status-badge",
                        STATUS_COLORS[deadline.status]
                      )}
                    >
                      {STATUS_LABELS[deadline.status]}
                    </span>
                    {deadline.closingDate && (
                      <span className={cn("text-xs font-medium", colorClass)}>
                        {formatRelativeDate(deadline.closingDate)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
