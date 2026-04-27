import { AlertTriangle, Footprints, Accessibility } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { AccessibilityGuide } from "../../types/api";

const METHOD_STYLE: Record<string, string> = {
  Elevator: "bg-emerald-100 text-emerald-700",
  "Escalator only": "bg-amber-100 text-amber-700",
  "Stairs only": "bg-red-100 text-red-700",
  "Elevator out of service": "bg-red-100 text-red-700",
};

export function StationAccessibilityCard({ guide }: { guide: AccessibilityGuide }) {
  const { t } = useTranslation();

  return (
    <article className="rounded-[2rem] border border-white/70 bg-white/95 p-6 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate">
            {t("accessibilityGuide")}
          </p>
          <h3 className="mt-2 font-display text-2xl text-ink">
            {guide.station.stop_name}
          </h3>
        </div>
        <div className="flex gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              guide.station.ada_accessible
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {guide.station.ada_accessible ? t("adaAccessible") : t("adaNotAccessible")}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              METHOD_STYLE[guide.access_method] ?? "bg-slate-100 text-slate-600"
            }`}
          >
            {guide.access_method}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-2xl bg-mist p-4">
          <Footprints className="h-6 w-6 text-tide" />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate">{t("ambulatoryTime")}</p>
            <p className="mt-1 font-display text-2xl text-ink">
              ~{guide.estimated_travel.ambulatory_minutes} {t("minutes")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-mist p-4">
          <Accessibility className="h-6 w-6 text-tide" />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate">{t("wheelchairTime")}</p>
            <p className="mt-1 font-display text-2xl text-ink">
              ~{guide.estimated_travel.wheelchair_minutes} {t("minutes")}
            </p>
          </div>
        </div>
      </div>

      {guide.mobility_notes.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm text-slate">
          {guide.mobility_notes.map((note) => (
            <li key={note} className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-tide" />
              {note}
            </li>
          ))}
        </ul>
      )}

      {guide.alternatives_during_outage.length > 0 && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            {t("outageAlternatives")}
          </div>
          <ul className="mt-2 space-y-1 text-sm text-amber-700">
            {guide.alternatives_during_outage.map((alt, i) => (
              <li key={i}>{alt}</li>
            ))}
          </ul>
        </div>
      )}

      {guide.equipment.length > 0 && (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate">{t("equipmentList")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {guide.equipment.map((e) => (
              <span
                key={e.equipment_id}
                className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-semibold text-ink"
              >
                {e.equipment_type}: {e.short_description || e.equipment_id}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
