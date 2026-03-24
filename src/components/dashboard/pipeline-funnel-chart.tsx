"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { STATUS_LABELS } from "@/lib/utils";

interface PipelineFunnelChartProps {
  byStatus: Array<{ status: string; _count: number }>;
  loading: boolean;
}

const STATUS_ORDER = [
  "IDENTIFIED",
  "ANALYZING",
  "GO",
  "BUDGETING",
  "PROPOSAL_SENT",
  "WON",
  "LOST",
];

const STATUS_CHART_COLORS: Record<string, string> = {
  IDENTIFIED: "#94A3B8",
  ANALYZING: "#3B82F6",
  GO: "#10B981",
  NO_GO: "#EF4444",
  BUDGETING: "#F59E0B",
  PROPOSAL_SENT: "#8B5CF6",
  WON: "#059669",
  LOST: "#DC2626",
  CANCELED: "#6B7280",
};

export function PipelineFunnelChart({ byStatus, loading }: PipelineFunnelChartProps) {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="skeleton h-5 w-48 rounded mb-4" />
        <div className="skeleton h-64 w-full rounded-lg" />
      </div>
    );
  }

  const data = STATUS_ORDER.map((status) => {
    const found = byStatus.find((s) => s.status === status);
    return {
      status,
      label: STATUS_LABELS[status] ?? status,
      count: found?._count ?? 0,
      fill: STATUS_CHART_COLORS[status] ?? "#94A3B8",
    };
  }).filter((d) => d.count > 0);

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-heading font-semibold text-base">Pipeline de Licitações</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Distribuição por etapa do processo</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-heading font-bold">
            {byStatus.reduce((sum, s) => sum + s._count, 0)}
          </p>
          <p className="text-xs text-muted-foreground">total</p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
          Nenhuma licitação encontrada
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={50}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
              formatter={(value: number) => [value, "Licitações"]}
              labelStyle={{ fontWeight: 600 }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
