import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getAnalytics } from "../api/analytics";
import { translateServiceStatus } from "../lib/i18nTransit";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { SectionTitle } from "../components/common/SectionTitle";

const STATUS_COLORS: Record<string, string> = {
  "Good Service": "#22c55e",
  "Planned Work": "#f59e0b",
  "Service Change": "#3b82f6",
  Delays: "#ef4444",
  Suspended: "#6b7280",
};

const BAR_COLOR = "#0d6c7d";

const ADA_COLORS = ["#0d6c7d", "#e66b4c"];

export function AnalyticsPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["analytics"],
    queryFn: getAnalytics,
    refetchInterval: 60_000,
  });

  if (isLoading) return <LoadingState label={t("loadingAnalytics")} />;
  if (isError) return <ErrorState message={error.message} />;
  if (!data) return null;

  const statusData = Object.entries(data.status_breakdown).map(([name, value]) => ({
    name,
    nameLabel: translateServiceStatus(name, t),
    value,
  }));

  const adaData = [
    { name: t("adaAccessible"), value: data.ada_stats.accessible },
    { name: t("adaNotAccessible"), value: data.ada_stats.not_accessible },
  ];

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow={t("analytics")}
        title={t("analyticsTitle")}
        description={t("analyticsDesc")}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-panel">
          <h3 className="mb-4 font-display text-xl text-ink">{t("serviceBreakdown")}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={110}
                paddingAngle={3}
                dataKey="value"
                nameKey="nameLabel"
                label={(props) => {
                  const pl = props as { nameLabel?: string; name?: string; value?: number };
                  const nameLabel = pl.nameLabel ?? pl.name ?? "";
                  return `${nameLabel}: ${pl.value ?? ""}`;
                }}
              >
                {statusData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={STATUS_COLORS[entry.name] ?? "#94a3b8"}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </article>

        <article className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-panel">
          <h3 className="mb-4 font-display text-xl text-ink">{t("adaBreakdown")}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={adaData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={110}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {adaData.map((entry, i) => (
                  <Cell key={entry.name} fill={ADA_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </article>
      </div>

      <article className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-panel">
        <h3 className="mb-4 font-display text-xl text-ink">{t("alertsByRoute")}</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data.alerts_by_route} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="route_id" tick={{ fontSize: 14, fontWeight: 600 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill={BAR_COLOR} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </article>
    </div>
  );
}
