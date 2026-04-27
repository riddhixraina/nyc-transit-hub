import { apiGet } from "./client";
import type { HealthResponse, RouteStatus, StatusSummary } from "../types/api";

export function getRouteStatuses() {
  return apiGet<RouteStatus[]>("/api/status");
}

export function getStatusSummary() {
  return apiGet<StatusSummary>("/api/status/summary");
}

export function getHealth() {
  return apiGet<HealthResponse>("/api/health");
}
