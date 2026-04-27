import { useQuery } from "@tanstack/react-query";
import { getAlerts } from "../api/alerts";
import { getRouteStatuses, getStatusSummary } from "../api/status";
import { AlertCard } from "../components/alerts/AlertCard";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { SectionTitle } from "../components/common/SectionTitle";
import { RouteStatusCard } from "../components/dashboard/RouteStatusCard";
import { StatusSummaryCard } from "../components/dashboard/StatusSummaryCard";

export function DashboardPage() {
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
        eyebrow="Service status"
        title="System dashboard"
        description="Line health, alert volume, and the most recent disruptions are grouped here so the dashboard matches the first phase of the frontend plan."
      />

      {summaryQuery.isLoading ? (
        <LoadingState label="Loading summary cards..." />
      ) : summaryQuery.isError ? (
        <ErrorState message={summaryQuery.error.message} />
      ) : summary ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatusSummaryCard label="Total lines" value={summary.total_lines} />
          {Object.entries(summary.breakdown).map(([label, value]) => (
            <StatusSummaryCard key={label} label={label} value={value} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No summary data"
          description="The backend did not return a route status summary."
        />
      )}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
        <section className="space-y-4">
          <h3 className="font-display text-2xl text-ink">Route status cards</h3>
          {statusQuery.isLoading ? (
            <LoadingState label="Loading route statuses..." />
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
          <h3 className="font-display text-2xl text-ink">Recent alert panel</h3>
          {alertsQuery.isLoading ? (
            <LoadingState label="Loading alert panel..." />
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
              title="No active alerts"
              description="The route dashboard currently has no alert rows to show."
            />
          )}
        </section>
      </div>
    </div>
  );
}
