import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Clock, Footprints, Repeat } from "lucide-react";
import { getAlerts } from "../api/alerts";
import { getRoutes, getStops } from "../api/subway";
import { getStopEdges } from "../api/edges";
import { LineBullet } from "../components/planner/LineBullet";
import { StationCombobox } from "../components/planner/StationCombobox";
import { PlaceCombobox } from "../components/planner/PlaceCombobox";
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

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-panel sm:p-8">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">Where to?</h1>
        <p className="mt-2 max-w-xl text-sm text-slate">
          Real-time-aware subway routing. Pick stations, or enter any address.
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
            Stations
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
            Addresses
          </button>
        </div>

        {isLoading ? (
          <p className="mt-6 text-sm text-slate">Loading network graph...</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
            {mode === "stations" ? (
              <>
                <StationCombobox
                  label="From"
                  value={fromStation}
                  onChange={(s) => {
                    setFromStation(s);
                    setSubmitted(false);
                  }}
                  stations={stationsForPicker}
                  routesById={routesById}
                  placeholder="e.g. 14 St"
                />
                <StationCombobox
                  label="To"
                  value={toStation}
                  onChange={(s) => {
                    setToStation(s);
                    setSubmitted(false);
                  }}
                  stations={stationsForPicker}
                  routesById={routesById}
                  placeholder="e.g. 96 St"
                />
              </>
            ) : (
              <>
                <PlaceCombobox
                  label="From"
                  value={fromPlace}
                  onChange={(p) => {
                    setFromPlace(p);
                    setSubmitted(false);
                  }}
                  placeholder="e.g. 1 World Trade Center"
                />
                <PlaceCombobox
                  label="To"
                  value={toPlace}
                  onChange={(p) => {
                    setToPlace(p);
                    setSubmitted(false);
                  }}
                  placeholder="e.g. JFK Airport"
                />
              </>
            )}
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <button
                type="submit"
                disabled={!canPlan}
                className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Find route
              </button>
              <button
                type="button"
                onClick={handleSwap}
                className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-3 text-sm font-semibold text-ink"
              >
                <Repeat className="h-4 w-4" />
                Swap
              </button>
              {alertsQuery.data ? (
                <span className="text-xs text-slate">
                  {alerted.size} subway {alerted.size === 1 ? "line has" : "lines have"} an active alert
                </span>
              ) : null}
            </div>
          </form>
        )}
      </section>

      {submitted ? (
        plan ? (
          <PlanCard plan={plan} routesById={routesById} />
        ) : (
          <div className="rounded-3xl border border-white/70 bg-white/80 p-6 text-center text-sm text-slate shadow-panel">
            No route found. Try a closer pair, or switch modes.
          </div>
        )
      ) : null}
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
  const transferCount = plan.legs.filter((l) => l.kind === "transfer").length;
  const tagline =
    transferCount === 0 ? "Direct" : `${transferCount} transfer${transferCount > 1 ? "s" : ""}`;

  return (
    <article className="rounded-3xl border border-white/70 bg-white/95 p-6 shadow-panel">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate">
            Best route
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
              {Math.round(plan.totalWalkSeconds / 60)} min walking total (entry +
              exit)
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
            Active alert on{" "}
            {plan.affectedRoutes.map((l, i) => (
              <span key={l}>
                {i > 0 ? ", " : ""}
                <span className="font-bold">{l}</span>
              </span>
            ))}
            . Travel time already includes a delay buffer.
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
  if (leg.kind === "ride") {
    return (
      <li className="flex flex-wrap items-center gap-3 text-sm text-ink">
        <LineBullet line={leg.route_id} route={routesById.get(leg.route_id)} />
        <span className="font-medium">{leg.from_name}</span>
        <ArrowRight className="h-4 w-4 text-slate" />
        <span className="font-medium">{leg.to_name}</span>
        <span className="text-xs text-slate">
          ({Math.round(leg.seconds / 60)} min)
        </span>
      </li>
    );
  }
  if (leg.kind === "transfer") {
    return (
      <li className="flex flex-wrap items-center gap-3 text-xs text-slate">
        <Repeat className="h-3.5 w-3.5" />
        <span>
          Transfer at {leg.at_name} ({leg.from_route} → {leg.to_route},{" "}
          {Math.round(leg.seconds / 60)} min)
        </span>
      </li>
    );
  }
  return (
    <li className="flex flex-wrap items-center gap-3 text-xs text-slate">
      <Footprints className="h-3.5 w-3.5" />
      <span>
        Walk {Math.round(leg.meters)} m from {leg.from_label} to {leg.to_label} (
        {Math.round(leg.seconds / 60)} min)
      </span>
    </li>
  );
}
