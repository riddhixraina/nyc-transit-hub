import { apiGet } from "./client";
import type { Equipment, Outage, StationAccessibility } from "../types/api";

export function getEquipment(station?: string) {
  const params = new URLSearchParams();
  if (station) {
    params.set("station", station);
  }
  const query = params.toString();
  return apiGet<Equipment[]>(
    `/api/accessibility/equipment${query ? `?${query}` : ""}`,
  );
}

export function getOutages() {
  return apiGet<Outage[]>("/api/accessibility/outages");
}

export function getStationAccessibility(stopId: string) {
  return apiGet<StationAccessibility>(`/api/accessibility/station/${stopId}`);
}
