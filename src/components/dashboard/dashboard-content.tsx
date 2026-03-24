"use client";

import { trpc } from "@/lib/trpc";
import { KpiCard } from "./kpi-card";
import { PipelineFunnelChart } from "./pipeline-funnel-chart";
import { UpcomingDeadlines } from "./upcoming-deadlines";
import { RecentActivities } from "./recent-activities";
import { DocumentStatusWidget } from "./document-status-widget";
import {
  FileText,
  Calculator,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function DashboardContent() {
  const { data: stats, isLoading: statsLoading } = trpc.licitacao.getStats.useQuery();
  const { data: deadlines, isLoading: deadlinesLoading } =
    trpc.licitacao.getUpcomingDeadlines.useQuery();
  const { data: docStats, isLoading: docStatsLoading } =
    trpc.documento.getDocumentStats.useQuery();

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Licitações Ativas"
          value={stats?.totalActive ?? 0}
          variation={stats?.totalActiveVariation}
          icon={FileText}
          iconColor="text-blue-600"
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          loading={statsLoading}
        />
        <KpiCard
          title="Ganhas este Mês"
          value={stats?.won ?? 0}
          variation={stats?.wonVariation}
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          loading={statsLoading}
          suffix=" licit."
        />
        <KpiCard
          title="Taxa de Sucesso"
          value={`${stats?.successRate?.toFixed(1) ?? 0}%`}
          icon={Calculator}
          iconColor="text-amber-600"
          iconBg="bg-amber-50 dark:bg-amber-900/20"
          loading={statsLoading}
          isPercentage
        />
        <KpiCard
          title="Pipeline Total"
          value={formatCurrency(stats?.pipelineValue ?? 0)}
          icon={DollarSign}
          iconColor="text-purple-600"
          iconBg="bg-purple-50 dark:bg-purple-900/20"
          loading={statsLoading}
          isCurrency
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline funnel - spans 2 cols */}
        <div className="lg:col-span-2">
          <PipelineFunnelChart byStatus={stats?.byStatus ?? []} loading={statsLoading} />
        </div>

        {/* Upcoming deadlines */}
        <div>
          <UpcomingDeadlines deadlines={deadlines ?? []} loading={deadlinesLoading} />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activities - spans 2 cols */}
        <div className="lg:col-span-2">
          <RecentActivities activities={stats?.recentActivities ?? []} loading={statsLoading} />
        </div>

        {/* Document status */}
        <div>
          <DocumentStatusWidget stats={docStats} loading={docStatsLoading} />
        </div>
      </div>
    </div>
  );
}
