import type { Outage } from "../../types/api";
import { formatDateTime } from "../../lib/utils";

export function OutageCard({ outage }: { outage: Outage }) {
  return (
    <article className="rounded-[2rem] border border-white/80 bg-white/95 p-5 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate">
            {outage.equipment_type || "Equipment"}
          </p>
          <h3 className="mt-2 font-display text-2xl text-ink">
            {outage.station_name || outage.equipment_id}
          </h3>
        </div>
        <span className="rounded-full bg-coral/10 px-3 py-1 text-xs font-semibold text-coral">
          {outage.is_upcoming ? "Upcoming" : "Active"}
        </span>
      </div>
      <p className="mt-4 text-sm text-slate">
        {outage.reason || "No outage reason provided."}
      </p>
      <div className="mt-4 text-xs text-slate">
        <p>Out since: {formatDateTime(outage.out_of_service_date)}</p>
        <p className="mt-1">
          Estimated return: {formatDateTime(outage.estimated_return)}
        </p>
      </div>
    </article>
  );
}
