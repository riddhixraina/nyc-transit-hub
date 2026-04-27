import { apiGet } from "./client";
import type {
  Arrival,
  Route,
  RouteDetail,
  SearchResults,
  Station,
} from "../types/api";

export function getStops(route?: string) {
  const params = new URLSearchParams();
  if (route) {
    params.set("route", route);
  }
  const query = params.toString();
  return apiGet<Station[]>(`/api/subway/stops${query ? `?${query}` : ""}`);
}

export function getStop(stopId: string) {
  return apiGet<Station>(`/api/subway/stops/${stopId}`);
}

export function getArrivals(stopId: string, limit = 20) {
  return apiGet<Arrival[]>(`/api/subway/arrivals/${stopId}?limit=${limit}`);
}

export function getRoutes() {
  return apiGet<Route[]>("/api/subway/routes");
}

export function getRoute(routeId: string) {
  return apiGet<RouteDetail>(`/api/subway/routes/${routeId}`);
}

export function searchTransit(query: string, limit = 10) {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  return apiGet<SearchResults>(`/api/subway/search?${params.toString()}`);
}
