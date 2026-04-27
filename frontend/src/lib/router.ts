import type { ServiceAlert, Station } from "../types/api";
import type { StopEdge } from "../api/edges";
import { MinHeap } from "./minHeap";

export type Leg =
  | {
      kind: "ride";
      route_id: string;
      from_stop_id: string;
      from_name: string;
      to_stop_id: string;
      to_name: string;
      seconds: number;
      alerted: boolean;
    }
  | {
      kind: "transfer";
      at_stop_id: string;
      at_name: string;
      from_route: string;
      to_route: string;
      seconds: number;
    }
  | {
      kind: "walk";
      from_label: string;
      to_label: string;
      from_lat: number;
      from_lon: number;
      to_lat: number;
      to_lon: number;
      seconds: number;
      meters: number;
    };

export type RoutePlan = {
  legs: Leg[];
  totalSeconds: number;
  totalRideSeconds: number;
  totalTransferSeconds: number;
  totalWalkSeconds: number;
  affectedRoutes: string[];
  hasAlert: boolean;
};

export type Endpoint =
  | { kind: "station"; station: Station }
  | { kind: "place"; lat: number; lon: number; label: string };

const SOURCE = "__src__";
const SINK = "__sink__";
const SAME_STATION_TRANSFER_S = 30;
const COMPLEX_TRANSFER_S = 120;
const WALK_M_PER_S = 1.35;
const STREET_GRID_FACTOR = 1.3;
const MAX_NEAREST_STATIONS = 6;
const ALERT_PENALTY_MULT = 1.6;

type WalkMeta = {
  from_label: string;
  to_label: string;
  from_lat: number;
  from_lon: number;
  to_lat: number;
  to_lon: number;
  meters: number;
};

type EdgeRecord = {
  to: string;
  seconds: number;
  kind: "ride" | "transfer" | "walk";
  route_id?: string;
  walk?: WalkMeta;
};

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function parseLines(daytimeRoutes: string): string[] {
  return daytimeRoutes.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
}

export function parentStations(stations: Station[]): Station[] {
  const byId = new Map(stations.map((s) => [s.stop_id, s]));
  return stations.filter(
    (s) => !s.parent_station || !byId.has(s.parent_station),
  );
}

export function alertedRouteSet(
  alerts: ServiceAlert[],
  knownRoutes: Set<string>,
): Set<string> {
  const set = new Set<string>();
  for (const a of alerts) {
    for (const r of a.affected_routes.split(/[,\s]+/)) {
      const t = r.trim();
      if (t && knownRoutes.has(t)) set.add(t);
    }
  }
  return set;
}

function nodeKey(stopId: string, routeId: string) {
  return `${stopId}|${routeId}`;
}

function walkSeconds(distanceKm: number): number {
  return Math.round((distanceKm * 1000 * STREET_GRID_FACTOR) / WALK_M_PER_S);
}

export class TransitGraph {
  private adj = new Map<string, EdgeRecord[]>();
  private stationById = new Map<string, Station>();
  private complexes: Station[][] = [];

  constructor(parents: Station[], edges: StopEdge[]) {
    for (const s of parents) this.stationById.set(s.stop_id, s);

    const COMPLEX_MAX_KM = 0.2;
    const byKey = new Map<string, Station[]>();
    for (const s of parents) {
      const key = `${s.stop_name}|${s.borough}`;
      const arr = byKey.get(key);
      if (arr) arr.push(s);
      else byKey.set(key, [s]);
    }
    for (const candidates of byKey.values()) {
      const remaining = [...candidates];
      while (remaining.length > 0) {
        const seed = remaining.shift()!;
        const cluster = [seed];
        for (let i = remaining.length - 1; i >= 0; i -= 1) {
          const km = haversineKm(
            seed.stop_lat,
            seed.stop_lon,
            remaining[i].stop_lat,
            remaining[i].stop_lon,
          );
          if (km <= COMPLEX_MAX_KM) {
            cluster.push(remaining[i]);
            remaining.splice(i, 1);
          }
        }
        this.complexes.push(cluster);
      }
    }

    for (const e of edges) {
      this.addEdge(
        nodeKey(e.from_stop_id, e.route_id),
        nodeKey(e.to_stop_id, e.route_id),
        e.seconds,
        "ride",
        e.route_id,
      );
    }

    for (const station of parents) {
      const lines = parseLines(station.daytime_routes);
      for (let i = 0; i < lines.length; i += 1) {
        for (let j = i + 1; j < lines.length; j += 1) {
          this.addBidirectional(
            nodeKey(station.stop_id, lines[i]),
            nodeKey(station.stop_id, lines[j]),
            SAME_STATION_TRANSFER_S,
            "transfer",
          );
        }
      }
    }

    for (const group of this.complexes) {
      if (group.length < 2) continue;
      for (let a = 0; a < group.length; a += 1) {
        for (let b = a + 1; b < group.length; b += 1) {
          const sA = group[a];
          const sB = group[b];
          for (const lA of parseLines(sA.daytime_routes)) {
            for (const lB of parseLines(sB.daytime_routes)) {
              this.addBidirectional(
                nodeKey(sA.stop_id, lA),
                nodeKey(sB.stop_id, lB),
                COMPLEX_TRANSFER_S,
                "transfer",
              );
            }
          }
        }
      }
    }
  }

  private addEdge(
    from: string,
    to: string,
    seconds: number,
    kind: EdgeRecord["kind"],
    route_id?: string,
    walk?: WalkMeta,
  ) {
    let bucket = this.adj.get(from);
    if (!bucket) {
      bucket = [];
      this.adj.set(from, bucket);
    }
    bucket.push({ to, seconds, kind, route_id, walk });
  }

  private addBidirectional(
    a: string,
    b: string,
    seconds: number,
    kind: EdgeRecord["kind"],
  ) {
    this.addEdge(a, b, seconds, kind);
    this.addEdge(b, a, seconds, kind);
  }

  getStation(stopId: string): Station | undefined {
    return this.stationById.get(stopId);
  }

  getParents(): Station[] {
    return [...this.stationById.values()];
  }

  plan(
    from: Endpoint,
    to: Endpoint,
    alertedRoutes: Set<string>,
  ): RoutePlan | null {
    const ephemeral: Array<[string, EdgeRecord[]]> = [];
    const restore = () => {
      for (const [k, original] of ephemeral) {
        if (original.length === 0) this.adj.delete(k);
        else this.adj.set(k, original);
      }
    };
    const stash = (k: string) => {
      if (!ephemeral.some(([key]) => key === k))
        ephemeral.push([k, this.adj.get(k) ? [...this.adj.get(k)!] : []]);
    };

    const fromNodes = this.entryNodes(from, true, stash);
    const toNodes = this.entryNodes(to, false, stash);

    if (fromNodes.length === 0 || toNodes.length === 0) {
      restore();
      return null;
    }

    const result = this.dijkstra(SOURCE, SINK, alertedRoutes);
    restore();
    if (!result) return null;
    return this.materialize(result.path, result.totalSeconds, alertedRoutes);
  }

  private entryNodes(
    ep: Endpoint,
    isStart: boolean,
    stash: (k: string) => void,
  ): string[] {
    const nodes: string[] = [];
    if (ep.kind === "station") {
      const s = ep.station;
      const lines = parseLines(s.daytime_routes);
      for (const l of lines) {
        const node = nodeKey(s.stop_id, l);
        if (isStart) {
          stash(SOURCE);
          this.addEdge(SOURCE, node, 0, "walk");
        } else {
          stash(node);
          this.addEdge(node, SINK, 0, "walk");
        }
        nodes.push(node);
      }
      return nodes;
    }

    const parents = [...this.stationById.values()];
    const candidates = parents
      .map((s) => ({
        s,
        km: haversineKm(ep.lat, ep.lon, s.stop_lat, s.stop_lon),
      }))
      .sort((a, b) => a.km - b.km)
      .slice(0, MAX_NEAREST_STATIONS);

    for (const { s, km } of candidates) {
      const sec = walkSeconds(km);
      const meters = Math.round(km * 1000);
      for (const l of parseLines(s.daytime_routes)) {
        const node = nodeKey(s.stop_id, l);
        const walkMeta: WalkMeta = isStart
          ? {
              from_label: ep.label,
              to_label: s.stop_name,
              from_lat: ep.lat,
              from_lon: ep.lon,
              to_lat: s.stop_lat,
              to_lon: s.stop_lon,
              meters,
            }
          : {
              from_label: s.stop_name,
              to_label: ep.label,
              from_lat: s.stop_lat,
              from_lon: s.stop_lon,
              to_lat: ep.lat,
              to_lon: ep.lon,
              meters,
            };
        if (isStart) {
          stash(SOURCE);
          this.addEdge(SOURCE, node, sec, "walk", undefined, walkMeta);
        } else {
          stash(node);
          this.addEdge(node, SINK, sec, "walk", undefined, walkMeta);
        }
        nodes.push(node);
      }
    }
    return nodes;
  }

  private dijkstra(
    source: string,
    sink: string,
    alertedRoutes: Set<string>,
  ): { path: { node: string; edge: EdgeRecord | null }[]; totalSeconds: number } | null {
    const dist = new Map<string, number>();
    const prev = new Map<string, { node: string; edge: EdgeRecord }>();
    dist.set(source, 0);
    const heap = new MinHeap<[number, string]>((a, b) => a[0] - b[0]);
    heap.push([0, source]);

    while (heap.size() > 0) {
      const [d, u] = heap.pop()!;
      if (d > (dist.get(u) ?? Infinity)) continue;
      if (u === sink) break;
      const edges = this.adj.get(u);
      if (!edges) continue;
      for (const e of edges) {
        const w =
          e.kind === "ride" && e.route_id && alertedRoutes.has(e.route_id)
            ? e.seconds * ALERT_PENALTY_MULT
            : e.seconds;
        const nd = d + w;
        if (nd < (dist.get(e.to) ?? Infinity)) {
          dist.set(e.to, nd);
          prev.set(e.to, { node: u, edge: e });
          heap.push([nd, e.to]);
        }
      }
    }

    if (!dist.has(sink)) return null;

    const path: { node: string; edge: EdgeRecord | null }[] = [];
    let cur = sink;
    while (cur !== source) {
      const back = prev.get(cur);
      if (!back) return null;
      path.push({ node: cur, edge: back.edge });
      cur = back.node;
    }
    path.push({ node: source, edge: null });
    path.reverse();
    return { path, totalSeconds: dist.get(sink) ?? 0 };
  }

  private materialize(
    path: { node: string; edge: EdgeRecord | null }[],
    totalSeconds: number,
    alertedRoutes: Set<string>,
  ): RoutePlan {
    const legs: Leg[] = [];
    const affected = new Set<string>();
    let totalRide = 0;
    let totalTransfer = 0;
    let totalWalk = 0;

    type RideAccum = {
      route_id: string;
      from_stop_id: string;
      from_name: string;
      to_stop_id: string;
      to_name: string;
      seconds: number;
    };
    let ride: RideAccum | null = null;

    const flushRide = () => {
      if (!ride) return;
      const alerted = alertedRoutes.has(ride.route_id);
      legs.push({
        kind: "ride",
        route_id: ride.route_id,
        from_stop_id: ride.from_stop_id,
        from_name: ride.from_name,
        to_stop_id: ride.to_stop_id,
        to_name: ride.to_name,
        seconds: ride.seconds,
        alerted,
      });
      totalRide += ride.seconds;
      if (alerted) affected.add(ride.route_id);
      ride = null;
    };

    for (let i = 1; i < path.length; i += 1) {
      const cur = path[i];
      const prevNode = path[i - 1];
      if (!cur.edge) continue;
      const e = cur.edge;
      if (e.kind === "ride" && e.route_id) {
        const [fromStop] = prevNode.node.split("|");
        const [toStop] = cur.node.split("|");
        const fromName = this.stationById.get(fromStop)?.stop_name ?? fromStop;
        const toName = this.stationById.get(toStop)?.stop_name ?? toStop;
        if (ride && ride.route_id === e.route_id) {
          ride.to_stop_id = toStop;
          ride.to_name = toName;
          ride.seconds += e.seconds;
        } else {
          flushRide();
          ride = {
            route_id: e.route_id,
            from_stop_id: fromStop,
            from_name: fromName,
            to_stop_id: toStop,
            to_name: toName,
            seconds: e.seconds,
          };
        }
      } else if (e.kind === "transfer") {
        flushRide();
        const [stopId] = cur.node.split("|");
        const [, prevRoute] = prevNode.node.includes("|")
          ? prevNode.node.split("|")
          : ["", ""];
        const [, nextRoute] = cur.node.split("|");
        const name = this.stationById.get(stopId)?.stop_name ?? stopId;
        legs.push({
          kind: "transfer",
          at_stop_id: stopId,
          at_name: name,
          from_route: prevRoute,
          to_route: nextRoute,
          seconds: e.seconds,
        });
        totalTransfer += e.seconds;
      } else if (e.kind === "walk") {
        flushRide();
        if (e.walk && e.seconds > 0) {
          legs.push({
            kind: "walk",
            from_label: e.walk.from_label,
            to_label: e.walk.to_label,
            from_lat: e.walk.from_lat,
            from_lon: e.walk.from_lon,
            to_lat: e.walk.to_lat,
            to_lon: e.walk.to_lon,
            seconds: e.seconds,
            meters: e.walk.meters,
          });
          totalWalk += e.seconds;
        }
      }
    }
    flushRide();

    return {
      legs,
      totalSeconds: Math.round(totalSeconds),
      totalRideSeconds: totalRide,
      totalTransferSeconds: totalTransfer,
      totalWalkSeconds: totalWalk,
      affectedRoutes: [...affected],
      hasAlert: affected.size > 0,
    };
  }
}

export function buildEndpointFromStation(station: Station): Endpoint {
  return { kind: "station", station };
}

export function buildEndpointFromPlace(
  lat: number,
  lon: number,
  label: string,
): Endpoint {
  return { kind: "place", lat, lon, label };
}

export function formatDuration(totalSec: number): string {
  const mins = Math.round(totalSec / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}
