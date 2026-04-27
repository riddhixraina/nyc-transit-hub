export type Station = {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  parent_station: string;
  ada_accessible: number;
  ada_notes: string;
  borough: string;
  daytime_routes: string;
};

export type Route = {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_color: string;
  route_text_color: string;
};

export type RouteDetail = {
  route: Route;
  stops: Station[];
};

export type Arrival = {
  trip_id: string;
  route_id: string;
  stop_id: string;
  arrival_time: string | null;
  departure_time: string | null;
  delay_seconds: number;
  stop_name: string | null;
};

export type ServiceAlert = {
  id?: number;
  alert_id: string;
  header_text: string;
  description_text: string;
  severity_level: string;
  effect: string;
  affected_routes: string;
  affected_stops: string;
  active_period_start: string | null;
  active_period_end: string | null;
  fetched_at: string;
};

export type RouteStatus = {
  route_id: string;
  route_short_name: string;
  route_color: string;
  status: string;
  alert_count: number;
  alerts: Array<{
    alert_id: string;
    header_text: string;
    effect: string;
  }>;
};

export type StatusSummary = {
  total_lines: number;
  breakdown: Record<string, number>;
};

export type Equipment = {
  equipment_id: string;
  equipment_type: string;
  station_name: string;
  stop_id: string;
  short_description: string;
  ada_compliant: number;
  lines_served: string;
  travel_alternatives: string;
};

export type Outage = {
  id: number;
  equipment_id: string;
  reason: string;
  out_of_service_date: string;
  estimated_return: string;
  is_upcoming: number;
  fetched_at: string;
  equipment_type?: string;
  station_name?: string;
  short_description?: string;
  lines_served?: string;
};

export type StationAccessibility = {
  station: Pick<Station, "stop_id" | "stop_name" | "ada_accessible" | "ada_notes">;
  equipment: Equipment[];
  outages: Outage[];
};

export type AccessibilityGuide = StationAccessibility & {
  has_elevator: boolean;
  has_escalator: boolean;
  access_method: string;
  estimated_travel: {
    ambulatory_minutes: number;
    wheelchair_minutes: number;
  };
  mobility_notes: string[];
  alternatives_during_outage: string[];
};

export type AccessibilityStatsResponse = {
  ada_stations: { accessible: number; not_accessible: number };
  equipment: { total: number; elevators: number; escalators: number };
  active_outages: number;
};

export type SearchResults = {
  query: string;
  stops: Station[];
  routes: Route[];
};

export type AnalyticsResponse = {
  status_breakdown: Record<string, number>;
  alerts_by_route: Array<{ route_id: string; count: number }>;
  ada_stats: { accessible: number; not_accessible: number };
};

export type HealthResponse = {
  status: string;
  service: string;
  environment: string;
  scheduler_enabled: boolean;
  last_sync: {
    trip_updates: string | null;
    service_alerts: string | null;
    elevator_equipment: string | null;
    elevator_outages: string | null;
  };
  record_counts: {
    stations: number;
    routes: number;
    trip_updates: number;
    service_alerts: number;
    elevator_equipment: number;
    elevator_outages: number;
  };
};
