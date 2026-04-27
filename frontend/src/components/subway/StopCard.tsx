import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Station } from "../../types/api";
import { FavoriteButton } from "../favorites/FavoriteButton";

export function StopCard({ stop }: { stop: Station }) {
  const { t } = useTranslation();
  return (
    <article className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate">
            {stop.borough || t("defaultBorough")}
          </p>
          <h3 className="mt-2 font-display text-2xl text-ink">{stop.stop_name}</h3>
          <p className="mt-2 text-sm text-slate">{stop.stop_id}</p>
        </div>
        <FavoriteButton kind="stop" value={stop.stop_id} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {stop.daytime_routes.split(/\s+/).filter(Boolean).map((routeId) => (
          <span
            key={routeId}
            className="rounded-full bg-mist px-3 py-1 text-xs font-semibold text-ink"
          >
            {routeId}
          </span>
        ))}
        <span className="rounded-full bg-sand/60 px-3 py-1 text-xs font-semibold text-ink">
          {stop.ada_accessible ? t("adaLabel") : t("noAdaFlag")}
        </span>
      </div>
      <Link
        to={`/stations/${stop.stop_id}`}
        className="mt-5 inline-flex text-sm font-semibold text-tide"
      >
        {t("openStationDetail")}
      </Link>
    </article>
  );
}
