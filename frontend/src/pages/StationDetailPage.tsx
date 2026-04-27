import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { getAlertsForRoute } from "../api/alerts";
import { getStationAccessibility } from "../api/accessibility";
import { getArrivals, getStop } from "../api/subway";
import { AlertCard } from "../components/alerts/AlertCard";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { SectionTitle } from "../components/common/SectionTitle";
import { ArrivalBoard } from "../components/subway/ArrivalBoard";
import { FavoriteButton } from "../components/favorites/FavoriteButton";

export function StationDetailPage() {
  const { stopId = "" } = useParams();

  const stopQuery = useQuery({
    queryKey: ["stop", stopId],
    queryFn: () => getStop(stopId),
    enabled: Boolean(stopId),
  });

  const arrivalsQuery = useQuery({
    queryKey: ["arrivals", stopId],
    queryFn: () => getArrivals(stopId, 12),
    refetchInterval: 30_000,
    enabled: Boolean(stopId),
  });

  const accessibilityQuery = useQuery({
    queryKey: ["station-accessibility", stopId],
    queryFn: () => getStationAccessibility(stopId),
    refetchInterval: 300_000,
    enabled: Boolean(stopId),
  });

  const primaryRoute =
    stopQuery.data?.daytime_routes.split(/\s+/).filter(Boolean)[0] ?? "";

  const routeAlertsQuery = useQuery({
    queryKey: ["alerts", "station-route", primaryRoute],
    queryFn: () => getAlertsForRoute(primaryRoute),
    enabled: Boolean(primaryRoute),
    refetchInterval: 60_000,
  });

  if (stopQuery.isLoading) {
    return <LoadingState label="Loading station detail..." />;
  }

  if (stopQuery.isError) {
    return <ErrorState message={stopQuery.error.message} />;
  }

  if (!stopQuery.data) {
    return (
      <EmptyState
        title="No station data"
        description="The backend did not return a station detail payload."
      />
    );
  }

  const stop = stopQuery.data;
  const stationAccessibility = accessibilityQuery.data;
  const arrivals = arrivalsQuery.data ?? [];
  const relatedAlerts = routeAlertsQuery.data ?? [];

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow={stop.stop_id}
        title={stop.stop_name}
        description="Station detail combines metadata, arrivals, accessibility information, and route-linked alerts into a single view."
      />

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <article className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate">
                  Station info
                </p>
                <h2 className="mt-3 font-display text-3xl text-ink">
                  {stop.stop_name}
                </h2>
              </div>
              <FavoriteButton kind="stop" value={stop.stop_id} />
            </div>
            <div className="mt-5 grid gap-3 text-sm text-slate sm:grid-cols-2">
              <p>
                <span className="font-semibold text-ink">Routes:</span>{" "}
                {stop.daytime_routes || "Unavailable"}
              </p>
              <p>
                <span className="font-semibold text-ink">Borough:</span>{" "}
                {stop.borough || "Unavailable"}
              </p>
              <p>
                <span className="font-semibold text-ink">ADA:</span>{" "}
                {stop.ada_accessible ? "Accessible" : "No ADA flag"}
              </p>
              <p>
                <span className="font-semibold text-ink">Parent:</span>{" "}
                {stop.parent_station || "None"}
              </p>
            </div>
          </article>

          {accessibilityQuery.isLoading ? (
            <LoadingState label="Loading accessibility details..." />
          ) : accessibilityQuery.isError ? (
            <ErrorState message={accessibilityQuery.error.message} />
          ) : stationAccessibility ? (
            <article className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-panel">
              <p className="text-xs uppercase tracking-[0.24em] text-slate">
                Accessibility summary
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-mist p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate">
                    Equipment units
                  </p>
                  <p className="mt-2 font-display text-4xl text-ink">
                    {stationAccessibility.equipment.length}
                  </p>
                </div>
                <div className="rounded-3xl bg-mist p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate">
                    Current outages
                  </p>
                  <p className="mt-2 font-display text-4xl text-ink">
                    {stationAccessibility.outages.length}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate">
                {stationAccessibility.station.ada_notes || "No ADA notes available."}
              </p>
            </article>
          ) : (
            <EmptyState
              title="No accessibility summary"
              description="The backend did not return accessibility data for this station."
            />
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="font-display text-2xl text-ink">Real-time arrivals</h2>
            <p className="mt-2 text-sm text-slate">
              This panel refreshes every 30 seconds to match the backend trip
              update polling cadence.
            </p>
          </div>
          {arrivalsQuery.isLoading ? (
            <LoadingState label="Loading arrivals..." />
          ) : arrivalsQuery.isError ? (
            <ErrorState message={arrivalsQuery.error.message} />
          ) : (
            <ArrivalBoard arrivals={arrivals} />
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-ink">Related alerts</h2>
            <p className="mt-2 text-sm text-slate">
              Alerts are currently derived from the station’s first daytime route.
            </p>
          </div>
          <Link
            to="/alerts"
            className="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink"
          >
            Open full alerts
          </Link>
        </div>
        {routeAlertsQuery.isLoading ? (
          <LoadingState label="Loading related alerts..." />
        ) : routeAlertsQuery.isError ? (
          <ErrorState message={routeAlertsQuery.error.message} />
        ) : relatedAlerts.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {relatedAlerts.slice(0, 4).map((alert) => (
              <AlertCard key={alert.alert_id} alert={alert} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No related alerts"
            description="No active alerts were returned for the route linked to this station."
          />
        )}
      </section>
    </div>
  );
}
