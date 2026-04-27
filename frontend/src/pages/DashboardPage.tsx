import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getAlerts } from "../api/alerts";
import { getRouteStatuses, getStatusSummary } from "../api/status";
import { AlertCard } from "../components/alerts/AlertCard";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { SectionTitle } from "../components/common/SectionTitle";
import { RouteStatusCard } from "../components/dashboard/RouteStatusCard";
import { StatusSummaryCard } from "../components/dashboard/StatusSummaryCard";
import { translateServiceStatus } from "../lib/i18nTransit";

export function DashboardPage() {
  const { t } = useTranslation();
  const summaryQuery = useQuery({
    queryKey: ["status-summary"],
    queryFn: getStatusSummary,
    refetchInterval: 60_000,
  });

  const statusQuery = useQuery({
    queryKey: ["route-statuses"],
    queryFn: getRouteStatuses,
    refetchInterval: 60_000,
  });

  const alertsQuery = useQuery({
    queryKey: ["alerts", "dashboard"],
    queryFn: () => getAlerts(),
    refetchInterval: 60_000,
  });

  const summary = summaryQuery.data;
  const statuses = statusQuery.data ?? [];
  const alerts = alertsQuery.data ?? [];

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow={t("lineStatus")}
        title={t("systemDashboard")}
        description={t("dashboardDesc")}
      />

      {summaryQuery.isLoading ? (
        <LoadingState label={t("loadingSummary")} />
      ) : summaryQuery.isError ? (
        <ErrorState message={summaryQuery.error.message} />
      ) : summary ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatusSummaryCard label={t("totalLines")} value={summary.total_lines} />
          {Object.entries(summary.breakdown).map(([label, value]) => (
            <StatusSummaryCard
              key={label}
              label={translateServiceStatus(label, t)}
              value={value}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={t("noSummaryData")}
          description={t("dashboardNoSummaryDesc")}
        />
      )}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
        <section className="space-y-4">
          <h3 className="font-display text-2xl text-ink">{t("routeStatusCards")}</h3>
          {statusQuery.isLoading ? (
            <LoadingState label={t("loadingRoutes")} />
          ) : statusQuery.isError ? (
            <ErrorState message={statusQuery.error.message} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {statuses.map((route) => (
                <RouteStatusCard key={route.route_id} route={route} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="font-display text-2xl text-ink">{t("recentAlerts")}</h3>
          {alertsQuery.isLoading ? (
            <LoadingState label={t("loadingAlerts")} />
          ) : alertsQuery.isError ? (
            <ErrorState message={alertsQuery.error.message} />
          ) : alerts.length ? (
            <div className="space-y-4">
              {alerts.slice(0, 3).map((alert) => (
                <AlertCard key={alert.alert_id} alert={alert} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={t("noActiveAlerts")}
              description={t("dashboardNoAlertsDesc")}
            />
          )}
        </section>
      </div>
    </div>
  );
}
