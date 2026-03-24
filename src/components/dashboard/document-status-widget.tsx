import Link from "next/link";
import { cn } from "@/lib/utils";
import { FileCheck, AlertTriangle, XCircle, Clock } from "lucide-react";

interface DocStats {
  valid: number;
  expiring: number;
  expired: number;
  pending: number;
  total: number;
}

interface DocumentStatusWidgetProps {
  stats?: DocStats | null;
  loading: boolean;
}

export function DocumentStatusWidget({ stats, loading }: DocumentStatusWidgetProps) {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="skeleton h-5 w-40 rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
              <div className="skeleton w-8 h-8 rounded-lg" />
              <div className="flex-1">
                <div className="skeleton h-4 w-24 rounded mb-1" />
                <div className="skeleton h-3 w-16 rounded" />
              </div>
              <div className="skeleton h-6 w-8 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const items = [
    {
      label: "Válidos",
      count: stats?.valid ?? 0,
      icon: FileCheck,
      colorClass: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600",
      textClass: "text-emerald-600",
    },
    {
      label: "Vencendo em 30 dias",
      count: stats?.expiring ?? 0,
      icon: AlertTriangle,
      colorClass: "bg-amber-50 dark:bg-amber-900/20 text-amber-600",
      textClass: "text-amber-600",
    },
    {
      label: "Vencidos",
      count: stats?.expired ?? 0,
      icon: XCircle,
      colorClass: "bg-red-50 dark:bg-red-900/20 text-red-600",
      textClass: "text-red-600",
    },
    {
      label: "Pendentes",
      count: stats?.pending ?? 0,
      icon: Clock,
      colorClass: "bg-slate-50 dark:bg-slate-900/20 text-slate-600",
      textClass: "text-slate-600",
    },
  ];

  const total = stats?.total ?? 0;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading font-semibold text-base">Status Documental</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{total} documentos no sistema</p>
        </div>
        <Link href="/documentos/validades" className="text-xs text-primary font-medium hover:underline">
          Gerenciar
        </Link>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.label}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg",
              item.count > 0 && item.label !== "Válidos"
                ? "bg-muted/30"
                : ""
            )}
          >
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", item.colorClass)}>
              <item.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.label}</p>
            </div>
            <span className={cn("text-lg font-heading font-bold", item.textClass)}>
              {item.count}
            </span>
          </div>
        ))}
      </div>

      {(stats?.expiring ?? 0) > 0 && (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
            ⚠️ {stats?.expiring} documento(s) vencendo nos próximos 30 dias
          </p>
        </div>
      )}

      {(stats?.expired ?? 0) > 0 && (
        <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-700 dark:text-red-400 font-medium">
            🚨 {stats?.expired} documento(s) vencido(s) precisam de renovação
          </p>
        </div>
      )}
    </div>
  );
}
