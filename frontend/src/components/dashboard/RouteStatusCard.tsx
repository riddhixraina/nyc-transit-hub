import { Link } from "react-router-dom";
import type { RouteStatus } from "../../types/api";

const statusTone: Record<string, string> = {
  "Good Service": "bg-emerald-50 text-emerald-700 border-emerald-200",
  Delays: "bg-amber-50 text-amber-700 border-amber-200",
  "Service Change": "bg-orange-50 text-orange-700 border-orange-200",
  Suspended: "bg-rose-50 text-rose-700 border-rose-200",
  "Planned Work": "bg-sky-50 text-sky-700 border-sky-200",
};

export function RouteStatusCard({ route }: { route: RouteStatus }) {
  const color = route.route_color ? `#${route.route_color}` : "#112033";

  return (
    <Link
      to={`/routes/${route.route_id}`}
      className="rounded-[2rem] border border-white/80 bg-white/95 p-5 shadow-panel transition hover:-translate-y-1"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl font-display text-lg font-semibold text-white"
            style={{ backgroundColor: color }}
          >
            {route.route_short_name}
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate">
              Route
            </p>
            <p className="font-display text-2xl text-ink">{route.route_id}</p>
          </div>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone[route.status] ?? "bg-slate-100 text-slate-700 border-slate-200"}`}
        >
          {route.status}
        </span>
      </div>
      <div className="mt-5">
        <p className="text-sm text-slate">
          {route.alert_count} active {route.alert_count === 1 ? "alert" : "alerts"}
        </p>
        {route.alerts[0] ? (
          <p className="mt-2 text-sm text-ink">{route.alerts[0].header_text}</p>
        ) : (
          <p className="mt-2 text-sm text-slate">No active alerts for this line.</p>
        )}
      </div>
    </Link>
  );
}
