import { apiGet } from "./client";

export type StopEdge = {
  route_id: string;
  from_stop_id: string;
  to_stop_id: string;
  seconds: number;
};

export function getStopEdges() {
  return apiGet<StopEdge[]>("/api/subway/edges");
}
