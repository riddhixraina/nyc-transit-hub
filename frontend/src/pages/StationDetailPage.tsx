import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
    return <LoadingState label={t("loadingStationDetail")} />;
  }

  if (stopQuery.isError) {
    return <ErrorState message={stopQuery.error.message} />;
  }

  if (!stopQuery.data) {
    return (
      <EmptyState
        title={t("noStationData")}
        description={t("noStationDataDesc")}
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
        description={t("stationDetailDesc")}
      />

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <article className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate">
                  {t("stationInfo")}
                </p>
                <h2 className="mt-3 font-display text-3xl text-ink">
                  {stop.stop_name}
                </h2>
              </div>
              <FavoriteButton kind="stop" value={stop.stop_id} />
            </div>
            <div className="mt-5 grid gap-3 text-sm text-slate sm:grid-cols-2">
              <p>
                <span className="font-semibold text-ink">{t("routesLabel")}:</span>{" "}
                {stop.daytime_routes || t("unavailable")}
              </p>
              <p>
                <span className="font-semibold text-ink">{t("borough")}:</span>{" "}
                {stop.borough || t("unavailable")}
              </p>
              <p>
                <span className="font-semibold text-ink">{t("adaLabel")}:</span>{" "}
                {stop.ada_accessible ? t("accessible") : t("noAdaFlag")}
              </p>
              <p>
                <span className="font-semibold text-ink">{t("parentStation")}:</span>{" "}
                {stop.parent_station || t("none")}
              </p>
            </div>
          </article>

          {accessibilityQuery.isLoading ? (
            <LoadingState label={t("loadingGuide")} />
          ) : accessibilityQuery.isError ? (
            <ErrorState message={accessibilityQuery.error.message} />
          ) : stationAccessibility ? (
            <article className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-panel">
              <p className="text-xs uppercase tracking-[0.24em] text-slate">
                {t("accessibilitySummary")}
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-mist p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate">
                    {t("equipmentUnits")}
                  </p>
                  <p className="mt-2 font-display text-4xl text-ink">
                    {stationAccessibility.equipment.length}
                  </p>
                </div>
                <div className="rounded-3xl bg-mist p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate">
                    {t("currentOutages")}
                  </p>
                  <p className="mt-2 font-display text-4xl text-ink">
                    {stationAccessibility.outages.length}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate">
                {stationAccessibility.station.ada_notes || t("noAdaNotes")}
              </p>
            </article>
          ) : (
            <EmptyState
              title={t("noAccessibilityData")}
              description={t("noAccessibilityDataDesc")}
            />
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="font-display text-2xl text-ink">{t("realtimeArrivals")}</h2>
            <p className="mt-2 text-sm text-slate">{t("arrivalsRefreshNote")}</p>
          </div>
          {arrivalsQuery.isLoading ? (
            <LoadingState label={t("loadingArrivals")} />
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
            <h2 className="font-display text-2xl text-ink">{t("relatedAlerts")}</h2>
            <p className="mt-2 text-sm text-slate">{t("relatedAlertsNote")}</p>
          </div>
          <Link
            to="/alerts"
            className="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink"
          >
            {t("openFullAlerts")}
          </Link>
        </div>
        {routeAlertsQuery.isLoading ? (
          <LoadingState label={t("loadingRelatedAlerts")} />
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
            title={t("noRelatedAlerts")}
            description={t("noRelatedAlertsDesc")}
          />
        )}
      </section>
    </div>
  );
}
