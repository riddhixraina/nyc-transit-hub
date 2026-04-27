import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getAlerts } from "../api/alerts";
import { getRoutes } from "../api/subway";
import { AlertCard } from "../components/alerts/AlertCard";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { SectionTitle } from "../components/common/SectionTitle";

export function AlertsPage() {
  const { t } = useTranslation();
  const [routeFilter, setRouteFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");

  const routesQuery = useQuery({
    queryKey: ["routes"],
    queryFn: getRoutes,
  });

  const alertsQuery = useQuery({
    queryKey: ["alerts", routeFilter, severityFilter],
    queryFn: () =>
      getAlerts({
        route: routeFilter || undefined,
        severity: severityFilter || undefined,
      }),
    refetchInterval: 60_000,
  });

  const alerts = alertsQuery.data ?? [];

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow={t("alertsView")}
        title={t("activeServiceAlerts")}
        description="Route and severity filters are applied directly against the backend alert endpoints so the UI stays aligned with the current API surface."
      />

      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-panel">
        <div className="grid gap-4 lg:grid-cols-2">
          <select
            value={routeFilter}
            onChange={(event) => setRouteFilter(event.target.value)}
            className="rounded-full border border-ink/10 bg-white px-5 py-3 text-sm text-ink outline-none"
          >
            <option value="">{t("allRoutes")}</option>
            {routesQuery.data?.map((route) => (
              <option key={route.route_id} value={route.route_id}>
                {route.route_id}
              </option>
            ))}
          </select>
          <select
            value={severityFilter}
            onChange={(event) => setSeverityFilter(event.target.value)}
            className="rounded-full border border-ink/10 bg-white px-5 py-3 text-sm text-ink outline-none"
          >
            <option value="">{t("allSeverities")}</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="SEVERE">SEVERE</option>
            <option value="UNKNOWN">UNKNOWN</option>
          </select>
        </div>
      </section>

      {alertsQuery.isLoading ? (
        <LoadingState label={t("loadingAlerts")} />
      ) : alertsQuery.isError ? (
        <ErrorState message={alertsQuery.error.message} />
      ) : alerts.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {alerts.map((alert) => (
            <AlertCard key={alert.alert_id} alert={alert} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={t("noAlertsMatch")}
          description="Try widening the route or severity criteria."
        />
      )}
    </div>
  );
}
