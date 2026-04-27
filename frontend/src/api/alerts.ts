import { apiGet } from "./client";
import type { ServiceAlert } from "../types/api";

type AlertFilters = {
  route?: string;
  severity?: string;
};

export function getAlerts(filters: AlertFilters = {}) {
  const params = new URLSearchParams();
  if (filters.route) {
    params.set("route", filters.route);
  }
  if (filters.severity) {
    params.set("severity", filters.severity);
  }
  const query = params.toString();
  return apiGet<ServiceAlert[]>(`/api/alerts${query ? `?${query}` : ""}`);
}

export function getAlert(alertId: string) {
  return apiGet<ServiceAlert>(`/api/alerts/${alertId}`);
}

export function getAlertsForRoute(routeId: string) {
  return apiGet<ServiceAlert[]>(`/api/alerts/route/${routeId}`);
}
