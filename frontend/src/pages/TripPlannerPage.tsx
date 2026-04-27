import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ArrowRight, Clock, Footprints, Repeat } from "lucide-react";
import { getAlerts } from "../api/alerts";
import { getRoutes, getStops } from "../api/subway";
import { getStopEdges } from "../api/edges";
import { API_BASE } from "../api/client";
import { LineBullet } from "../components/planner/LineBullet";
import { StationCombobox } from "../components/planner/StationCombobox";
import { PlaceCombobox } from "../components/planner/PlaceCombobox";
import { ErrorState } from "../components/common/ErrorState";
import {
  TransitGraph,
  alertedRouteSet,
  buildEndpointFromPlace,
  buildEndpointFromStation,
  formatDuration,
  parentStations,
  type Endpoint,
  type Leg,
  type RoutePlan,
} from "../lib/router";
import type { GeocodeHit } from "../lib/geocode";
import type { Route, Station } from "../types/api";

type Mode = "stations" | "places";

export function TripPlannerPage() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>("stations");
  const [fromStation, setFromStation] = useState<Station | null>(null);
  const [toStation, setToStation] = useState<Station | null>(null);
  const [fromPlace, setFromPlace] = useState<GeocodeHit | null>(null);
  const [toPlace, setToPlace] = useState<GeocodeHit | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const stationsQuery = useQuery({
    queryKey: ["stations"],
    queryFn: () => getStops(),
    staleTime: 5 * 60_000,
  });
  const routesQuery = useQuery({
    queryKey: ["routes"],
    queryFn: getRoutes,
    staleTime: 5 * 60_000,
  });
  const edgesQuery = useQuery({
    queryKey: ["stop-edges"],
    queryFn: getStopEdges,
    staleTime: 60 * 60_000,
  });
  const alertsQuery = useQuery({
    queryKey: ["alerts", "planner"],
    queryFn: () => getAlerts(),
    refetchInterval: 60_000,
  });

  const allStations = stationsQuery.data ?? [];
  const stationsForPicker = useMemo(
    () => parentStations(allStations).sort((a, b) => a.stop_name.localeCompare(b.stop_name)),
    [allStations],
  );

  const routesById = useMemo(() => {
    const map = new Map<string, Route>();
    for (const r of routesQuery.data ?? []) map.set(r.route_id, r);
    return map;
  }, [routesQuery.data]);

  const knownRoutes = useMemo(
    () => new Set((routesQuery.data ?? []).map((r) => r.route_id)),
    [routesQuery.data],
  );

  const alerted = useMemo(
    () => alertedRouteSet(alertsQuery.data ?? [], knownRoutes),
    [alertsQuery.data, knownRoutes],
  );

  const graph = useMemo(() => {
    if (!stationsQuery.data || !edgesQuery.data) return null;
    const parents = parentStations(stationsQuery.data);
    return new TransitGraph(parents, edgesQuery.data);
  }, [stationsQuery.data, edgesQuery.data]);

  const fromEndpoint: Endpoint | null = useMemo(() => {
    if (mode === "stations") return fromStation ? buildEndpointFromStation(fromStation) : null;
    return fromPlace ? buildEndpointFromPlace(fromPlace.lat, fromPlace.lon, fromPlace.label) : null;
  }, [mode, fromStation, fromPlace]);

  const toEndpoint: Endpoint | null = useMemo(() => {
    if (mode === "stations") return toStation ? buildEndpointFromStation(toStation) : null;
    return toPlace ? buildEndpointFromPlace(toPlace.lat, toPlace.lon, toPlace.label) : null;
  }, [mode, toStation, toPlace]);

  const plan: RoutePlan | null = useMemo(() => {
    if (!submitted || !graph || !fromEndpoint || !toEndpoint) return null;
    return graph.plan(fromEndpoint, toEndpoint, alerted);
  }, [submitted, graph, fromEndpoint, toEndpoint, alerted]);

  const canPlan =
    mode === "stations"
      ? !!fromStation && !!toStation && fromStation.stop_id !== toStation.stop_id
      : !!fromPlace && !!toPlace;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canPlan) setSubmitted(true);
  };

  const handleSwap = () => {
    if (mode === "stations") {
      setFromStation(toStation);
      setToStation(fromStation);
    } else {
      setFromPlace(toPlace);
      setToPlace(fromPlace);
    }
    setSubmitted(false);
  };

  const isLoading = stationsQuery.isLoading || routesQuery.isLoading || edgesQuery.isLoading;
  const loadError = stationsQuery.error ?? edgesQuery.error;
  const hasGraph =
    (edgesQuery.data?.length ?? 0) > 0 && stationsForPicker.length > 0;
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!submitted) return;
    resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [submitted, plan]);

  return (
    <div className="space-y-8">
      {loadError ? (
        <ErrorState
          message={t("plannerLoadError", {
            message:
              loadError instanceof Error
                ? loadError.message
                : t("plannerErrorUnknown"),
            api: API_BASE,
          })}
        />
      ) : null}
      {!isLoading && !loadError && !stationsForPicker.length ? (
        <p className="text-sm text-coral">{t("plannerNoStationsLoaded")}</p>
      ) : null}
      {!isLoading && !loadError && stationsForPicker.length > 0 && (edgesQuery.data?.length ?? 0) === 0 ? (
        <p className="text-sm text-coral">{t("plannerNoEdges")}</p>
      ) : null}
      <section className="overflow-visible rounded-3xl border border-white/70 bg-white/90 p-6 shadow-panel sm:p-8">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">{t("plannerTitle")}</h1>
        <p className="mt-2 max-w-xl text-sm text-slate">
          {t("plannerSubtitle")}
        </p>

        <div className="mt-5 inline-flex rounded-full border border-ink/10 bg-mist p-1 text-sm font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode("stations");
              setSubmitted(false);
            }}
            className={`rounded-full px-4 py-1.5 transition ${
              mode === "stations" ? "bg-ink text-white" : "text-slate"
            }`}
          >
            {t("plannerModeStations")}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("places");
              setSubmitted(false);
            }}
            className={`rounded-full px-4 py-1.5 transition ${
              mode === "places" ? "bg-ink text-white" : "text-slate"
            }`}
          >
            {t("plannerModePlaces")}
          </button>
        </div>

        {isLoading ? (
          <p className="mt-6 text-sm text-slate">{t("plannerLoadingGraph")}</p>
        ) : loadError ? null : (
          <form
            onSubmit={handleSubmit}
            className="mt-6 grid gap-4 overflow-visible sm:grid-cols-2"
          >
            {mode === "stations" ? (
              <>
                <StationCombobox
                  label={t("plannerLabelFrom")}
                  value={fromStation}
                  onChange={(s) => {
                    setFromStation(s);
                    setSubmitted(false);
                  }}
                  stations={stationsForPicker}
                  routesById={routesById}
                  placeholder={t("plannerPhStation1")}
                />
                <StationCombobox
                  label={t("plannerLabelTo")}
                  value={toStation}
                  onChange={(s) => {
                    setToStation(s);
                    setSubmitted(false);
                  }}
                  stations={stationsForPicker}
                  routesById={routesById}
                  placeholder={t("plannerPhStation2")}
                />
              </>
            ) : (
              <>
                <PlaceCombobox
                  label={t("plannerLabelFrom")}
                  value={fromPlace}
                  onChange={(p) => {
                    setFromPlace(p);
                    setSubmitted(false);
                  }}
                  placeholder={t("plannerPhPlace1")}
                />
                <PlaceCombobox
                  label={t("plannerLabelTo")}
                  value={toPlace}
                  onChange={(p) => {
                    setToPlace(p);
                    setSubmitted(false);
                  }}
                  placeholder={t("plannerPhPlace2")}
                />
              </>
            )}
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <button
                type="submit"
                disabled={!canPlan || !hasGraph}
                className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                title={!hasGraph ? t("plannerNoGraphTitle") : undefined}
              >
                {t("plannerFindRoute")}
              </button>
              <button
                type="button"
                onClick={handleSwap}
                className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-3 text-sm font-semibold text-ink"
              >
                <Repeat className="h-4 w-4" />
                {t("plannerSwap")}
              </button>
              {alertsQuery.data ? (
                <span className="text-xs text-slate">
                  {t("plannerAlertCount", { count: alerted.size })}
                </span>
              ) : null}
            </div>
          </form>
        )}
      </section>

      <div ref={resultRef} className="scroll-mt-8">
        {submitted ? (
          plan ? (
            <PlanCard plan={plan} routesById={routesById} />
          ) : (
            <div className="rounded-3xl border border-white/70 bg-white/80 p-6 text-center text-sm text-slate shadow-panel">
              {t("plannerNoRoute")}
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  routesById,
}: {
  plan: RoutePlan;
  routesById: Map<string, Route>;
}) {
  const { t } = useTranslation();
  const transferCount = plan.legs.filter((l) => l.kind === "transfer").length;
  const tagline =
    transferCount === 0
      ? t("plannerTaglineDirect")
      : t("plannerTaglineTransfer", { count: transferCount });

  return (
    <article className="rounded-3xl border border-white/70 bg-white/95 p-6 shadow-panel">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate">
            {t("plannerBestRoute")}
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-tide">
            {tagline}
          </span>
        </div>
        <div className="flex items-center gap-2 font-display text-2xl text-ink">
          <Clock className="h-5 w-5 text-slate" />
          <span>{formatDuration(plan.totalSeconds)}</span>
        </div>
      </header>

      <ol className="mt-5 space-y-3">
        {plan.totalWalkSeconds > 0 ? (
          <li className="flex items-center gap-3 text-sm text-slate">
            <Footprints className="h-4 w-4" />
            <span>
              {t("plannerWalkTotal", {
                minutes: Math.round(plan.totalWalkSeconds / 60),
              })}
            </span>
          </li>
        ) : null}
        {plan.legs.map((leg, idx) => (
          <LegRow key={idx} leg={leg} routesById={routesById} />
        ))}
      </ol>

      {plan.hasAlert ? (
        <div className="mt-5 rounded-2xl border border-coral/40 bg-coral/10 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-coral">
            <AlertTriangle className="h-4 w-4" />
            {t("plannerAlertOnLines", {
              lines: plan.affectedRoutes.join(", "),
            })}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function LegRow({
  leg,
  routesById,
}: {
  leg: Leg;
  routesById: Map<string, Route>;
}) {
  const { t } = useTranslation();
  if (leg.kind === "ride") {
    return (
      <li className="flex flex-wrap items-center gap-3 text-sm text-ink">
        <LineBullet line={leg.route_id} route={routesById.get(leg.route_id)} />
        <span className="font-medium">{leg.from_name}</span>
        <ArrowRight className="h-4 w-4 text-slate" />
        <span className="font-medium">{leg.to_name}</span>
        <span className="text-xs text-slate">
          {t("plannerLegMinutes", { minutes: Math.round(leg.seconds / 60) })}
        </span>
      </li>
    );
  }
  if (leg.kind === "transfer") {
    return (
      <li className="flex flex-wrap items-center gap-3 text-xs text-slate">
        <Repeat className="h-3.5 w-3.5" />
        <span>
          {t("plannerTransferLeg", {
            at: leg.at_name,
            from: leg.from_route,
            to: leg.to_route,
            mins: Math.round(leg.seconds / 60),
          })}
        </span>
      </li>
    );
  }
  return (
    <li className="flex flex-wrap items-center gap-3 text-xs text-slate">
      <Footprints className="h-3.5 w-3.5" />
      <span>
        {t("plannerWalkLeg", {
          meters: Math.round(leg.meters),
          from: leg.from_label,
          to: leg.to_label,
          mins: Math.round(leg.seconds / 60),
        })}
      </span>
    </li>
  );
}
