import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { getAlertsForRoute } from "../api/alerts";
import { getRoute } from "../api/subway";
import { AlertCard } from "../components/alerts/AlertCard";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { SectionTitle } from "../components/common/SectionTitle";
import { StopCard } from "../components/subway/StopCard";
import { FavoriteButton } from "../components/favorites/FavoriteButton";

export function RouteDetailPage() {
  const { routeId = "" } = useParams();

  const routeQuery = useQuery({
    queryKey: ["route", routeId],
    queryFn: () => getRoute(routeId),
    enabled: Boolean(routeId),
  });

  const alertsQuery = useQuery({
    queryKey: ["alerts", "route", routeId],
    queryFn: () => getAlertsForRoute(routeId),
    enabled: Boolean(routeId),
    refetchInterval: 60_000,
  });

  if (routeQuery.isLoading) {
    return <LoadingState label="Loading route detail..." />;
  }

  if (routeQuery.isError) {
    return <ErrorState message={routeQuery.error.message} />;
  }

  if (!routeQuery.data) {
    return (
      <EmptyState
        title="No route data"
        description="The backend did not return a route detail payload."
      />
    );
  }

  const routeDetail = routeQuery.data;
  const alerts = alertsQuery.data ?? [];

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow={routeDetail.route.route_id}
        title={routeDetail.route.route_long_name || routeDetail.route.route_id}
        description="Route detail includes line metadata, the stations it serves, and alerts scoped to the selected line."
      />

      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span
              className="flex h-16 w-16 items-center justify-center rounded-3xl font-display text-2xl font-semibold text-white"
              style={{
                backgroundColor: routeDetail.route.route_color
                  ? `#${routeDetail.route.route_color}`
                  : "#112033",
              }}
            >
              {routeDetail.route.route_short_name || routeDetail.route.route_id}
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate">
                Route detail
              </p>
              <h2 className="mt-2 font-display text-3xl text-ink">
                {routeDetail.route.route_id}
              </h2>
              <p className="mt-2 text-sm text-slate">
                {routeDetail.route.route_long_name}
              </p>
            </div>
          </div>
          <FavoriteButton kind="route" value={routeDetail.route.route_id} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Stations served</h2>
        {routeDetail.stops.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {routeDetail.stops.map((stop) => (
              <StopCard key={stop.stop_id} stop={stop} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No stations available"
            description="The backend route detail did not include any stops for this line."
          />
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Alerts for this route</h2>
        {alertsQuery.isLoading ? (
          <LoadingState label="Loading route alerts..." />
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
            title="No active alerts"
            description="This route currently has no matching alert records."
          />
        )}
      </section>
    </div>
  );
}
