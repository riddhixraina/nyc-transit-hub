import { useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { getAlerts } from "../api/alerts";
import { getHealth, getStatusSummary } from "../api/status";
import { searchTransit } from "../api/subway";
import { translateServiceStatus } from "../lib/i18nTransit";
import { AlertCard } from "../components/alerts/AlertCard";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { SearchInput } from "../components/common/SearchInput";
import { SectionTitle } from "../components/common/SectionTitle";
import { StatusSummaryCard } from "../components/dashboard/StatusSummaryCard";

export function HomePage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const summaryQuery = useQuery({
    queryKey: ["status-summary"],
    queryFn: getStatusSummary,
    refetchInterval: 60_000,
  });

  const alertsQuery = useQuery({
    queryKey: ["alerts", "homepage"],
    queryFn: () => getAlerts(),
    refetchInterval: 60_000,
  });

  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    refetchInterval: 60_000,
  });

  const searchQuery = useQuery({
    queryKey: ["transit-search", deferredSearch],
    queryFn: () => searchTransit(deferredSearch, 5),
    enabled: deferredSearch.trim().length >= 2,
  });

  const summary = summaryQuery.data;
  const alerts = alertsQuery.data ?? [];
  const health = healthQuery.data;

  return (
    <div className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-tide">
            {t("nycSubwayPulse")}
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-5xl leading-tight text-ink">
            {t("heroTitle")}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate">{t("heroSubtitle")}</p>
          <div className="mt-6 max-w-xl">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t("homeSearchPlaceholder")}
            />
            {searchQuery.isSuccess &&
            (searchQuery.data.routes.length || searchQuery.data.stops.length) ? (
              <div className="mt-4 grid gap-3 rounded-[2rem] border border-ink/10 bg-mist/70 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate">
                    {t("matchingRoutes")}
                  </p>
                  <div className="mt-3 space-y-2">
                    {searchQuery.data.routes.map((route) => (
                      <Link
                        key={route.route_id}
                        to={`/routes/${route.route_id}`}
                        className="block rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-ink"
                      >
                        {route.route_id} · {route.route_long_name || route.route_short_name}
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate">
                    {t("matchingStations")}
                  </p>
                  <div className="mt-3 space-y-2">
                    {searchQuery.data.stops.map((stop) => (
                      <Link
                        key={stop.stop_id}
                        to={`/stations/${stop.stop_id}`}
                        className="block rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-ink"
                      >
                        {stop.stop_name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/dashboard"
              className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
            >
              {t("openDashboard")}
            </Link>
            <Link
              to="/stations"
              className="rounded-full border border-ink/10 bg-white px-5 py-3 text-sm font-semibold text-ink"
            >
              {t("browseStationsBtn")}
            </Link>
            <Link
              to="/alerts"
              className="rounded-full border border-ink/10 bg-white px-5 py-3 text-sm font-semibold text-ink"
            >
              {t("reviewAlerts")}
            </Link>
          </div>
        </div>
        <div className="rounded-[2rem] border border-white/70 bg-ink p-8 text-white shadow-panel">
          <p className="text-xs uppercase tracking-[0.28em] text-white/60">
            {t("backendHealth")}
          </p>
          {healthQuery.isLoading ? (
            <div className="mt-4 text-sm text-white/70">{t("checkingService")}</div>
          ) : healthQuery.isError ? (
            <div className="mt-4 text-sm text-white/70">{t("healthEndpointUnavailable")}</div>
          ) : health ? (
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-4xl font-display">{health.status}</p>
                <p className="mt-1 text-sm text-white/70">
                  {health.scheduler_enabled ? t("schedulerStateOn") : t("schedulerStateOff")}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/50">
                    {t("stations")}
                  </p>
                  <p className="mt-2 font-display text-3xl">
                    {health.record_counts.stations}
                  </p>
                </div>
                <div className="rounded-3xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/50">
                    {t("alerts")}
                  </p>
                  <p className="mt-2 font-display text-3xl">
                    {health.record_counts.service_alerts}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-sm text-white/70">{t("healthDataUnavailable")}</div>
          )}
        </div>
      </section>

      <section className="space-y-5">
        <SectionTitle
          eyebrow={t("eyebrowDashPreview")}
          title={t("serviceSummary")}
          description={t("descServiceSummaryHome")}
        />
      {summaryQuery.isLoading ? (
        <LoadingState label={t("homeLoadingServiceSummary")} />
      ) : summaryQuery.isError ? (
        <ErrorState message={summaryQuery.error.message} />
      ) : summary ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
          title={t("noSummaryHomeTitle")}
          description={t("noSummaryHomeDesc")}
        />
      )}
      </section>

      <section className="space-y-5">
        <SectionTitle
          eyebrow={t("eyebrowActiveAlerts")}
          title={t("topDisruptions")}
          description={t("descTopDisruptionsHome")}
        />
      {alertsQuery.isLoading ? (
        <LoadingState label={t("homeLoadingAlerts")} />
      ) : alertsQuery.isError ? (
        <ErrorState message={alertsQuery.error.message} />
      ) : alerts.length ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {alerts.slice(0, 3).map((alert) => (
            <AlertCard key={alert.alert_id} alert={alert} />
          ))}
        </div>
        ) : (
          <EmptyState
            title={t("noActiveAlertsHomeTitle")}
            description={t("noActiveAlertsHomeDesc")}
          />
        )}
      </section>
    </div>
  );
}
