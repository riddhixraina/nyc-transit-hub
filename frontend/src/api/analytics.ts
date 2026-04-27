import { apiGet } from "./client";
import type { AnalyticsResponse } from "../types/api";

export function getAnalytics() {
  return apiGet<AnalyticsResponse>("/api/analytics");
}
