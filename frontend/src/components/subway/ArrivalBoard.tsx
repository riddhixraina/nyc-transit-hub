import { useTranslation } from "react-i18next";
import type { Arrival } from "../../types/api";
import { formatDateTime, formatDelay } from "../../lib/utils";
import { EmptyState } from "../common/EmptyState";

export function ArrivalBoard({ arrivals }: { arrivals: Arrival[] }) {
  const { t } = useTranslation();
  if (!arrivals.length) {
    return (
      <EmptyState
        title={t("noArrivalsCached")}
        description={t("noArrivalsDesc")}
      />
    );
  }

  return (
    <div className="space-y-3">
      {arrivals.map((arrival) => (
        <div
          key={`${arrival.trip_id}-${arrival.stop_id}-${arrival.arrival_time}`}
          className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-panel"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-display text-xl text-ink">{arrival.route_id}</p>
              <p className="text-sm text-slate">{arrival.stop_id}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-ink">
                {formatDateTime(arrival.arrival_time)}
              </p>
              <p className="text-xs text-slate">
                {formatDelay(arrival.delay_seconds)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
