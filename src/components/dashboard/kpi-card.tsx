import { cn } from "@/lib/utils";
import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  variation?: number;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  loading?: boolean;
  suffix?: string;
  isPercentage?: boolean;
  isCurrency?: boolean;
}

export function KpiCard({
  title,
  value,
  variation,
  icon: Icon,
  iconColor,
  iconBg,
  loading,
  suffix = "",
}: KpiCardProps) {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="skeleton h-4 w-24 rounded" />
          <div className="skeleton h-9 w-9 rounded-lg" />
        </div>
        <div className="skeleton h-8 w-32 rounded mb-2" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
    );
  }

  const isPositive = variation !== undefined ? variation >= 0 : null;

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", iconBg)}>
          <Icon className={cn("w-4 h-4", iconColor)} />
        </div>
      </div>

      <p className="text-2xl font-heading font-bold tracking-tight">
        {value}
        {suffix && <span className="text-base font-normal text-muted-foreground">{suffix}</span>}
      </p>

      {variation !== undefined && (
        <div
          className={cn(
            "flex items-center gap-1 mt-1.5 text-xs font-medium",
            isPositive ? "text-emerald-600" : "text-red-500"
          )}
        >
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span>
            {isPositive ? "+" : ""}
            {variation.toFixed(1)}% vs mês anterior
          </span>
        </div>
      )}
    </div>
  );
}
