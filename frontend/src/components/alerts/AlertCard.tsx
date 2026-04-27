import type { ServiceAlert } from "../../types/api";
import { formatDateTime } from "../../lib/utils";

export function AlertCard({ alert }: { alert: ServiceAlert }) {
  const routes = alert.affected_routes
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return (
    <article className="rounded-[2rem] border border-white/80 bg-white/95 p-5 shadow-panel">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-coral/10 px-3 py-1 text-xs font-semibold text-coral">
          {alert.severity_level || "UNKNOWN"}
        </span>
        <span className="rounded-full bg-mist px-3 py-1 text-xs font-semibold text-ink">
          {alert.effect || "UNKNOWN"}
        </span>
      </div>
      <h3 className="mt-4 font-display text-2xl text-ink">
        {alert.header_text || "Untitled alert"}
      </h3>
      <p className="mt-3 text-sm text-slate">
        {alert.description_text || "No additional description provided."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {routes.length ? (
          routes.map((route) => (
            <span
              key={route}
              className="rounded-full bg-sand/60 px-3 py-1 text-xs font-semibold text-ink"
            >
              {route}
            </span>
          ))
        ) : (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate">
            System-wide
          </span>
        )}
      </div>
      <div className="mt-5 text-xs text-slate">
        <p>Start: {formatDateTime(alert.active_period_start)}</p>
        <p className="mt-1">End: {formatDateTime(alert.active_period_end)}</p>
      </div>
    </article>
  );
}
