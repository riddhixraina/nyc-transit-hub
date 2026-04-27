import { useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { getAccessibilityGuide, getEquipment, getOutages } from "../api/accessibility";
import { apiGet } from "../api/client";
import type { Station } from "../types/api";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { SectionTitle } from "../components/common/SectionTitle";
import { OutageCard } from "../components/accessibility/OutageCard";
import { StationAccessibilityCard } from "../components/accessibility/StationAccessibilityCard";
import { AccessibilityStats } from "../components/accessibility/AccessibilityStats";

export function AccessibilityPage() {
  const { t } = useTranslation();
  const [stationSearch, setStationSearch] = useState("");
  const deferredSearch = useDeferredValue(stationSearch);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

  const stationsQuery = useQuery({
    queryKey: ["station-search", deferredSearch],
    queryFn: () =>
      apiGet<Station[]>(
        `/api/subway/stops?route=${encodeURIComponent(deferredSearch)}`,
      ).catch(() =>
        apiGet<Station[]>(`/api/subway/stops`).then((all) =>
          all.filter((s) =>
            s.stop_name.toLowerCase().includes(deferredSearch.toLowerCase()),
          ),
        ),
      ),
    enabled: deferredSearch.length >= 2,
  });

  const guideQuery = useQuery({
    queryKey: ["accessibility-guide", selectedStopId],
    queryFn: () => getAccessibilityGuide(selectedStopId!),
    enabled: Boolean(selectedStopId),
  });

  const equipmentQuery = useQuery({
    queryKey: ["equipment"],
    queryFn: () => getEquipment(),
    refetchInterval: 300_000,
  });

  const outagesQuery = useQuery({
    queryKey: ["outages"],
    queryFn: getOutages,
    refetchInterval: 300_000,
  });

  const matchedStations = stationsQuery.data ?? [];
  const outages = outagesQuery.data ?? [];
  const equipment = equipmentQuery.data ?? [];

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow={t("accessibility")}
        title={t("accessibilityTitle")}
        description={t("accessibilityDesc")}
      />

      {/* Station Accessibility Finder */}
      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-panel">
        <h2 className="font-display text-xl text-ink">{t("stationFinder")}</h2>
        <p className="mt-1 text-sm text-slate">{t("stationFinderDesc")}</p>
        <div className="relative mt-4">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate/50" />
          <input
            value={stationSearch}
            onChange={(e) => {
              setStationSearch(e.target.value);
              setSelectedStopId(null);
            }}
            placeholder={t("searchStationAccessibility")}
            className="w-full rounded-full border border-ink/10 bg-white py-3 pl-11 pr-5 text-sm text-ink outline-none transition focus:border-tide focus:ring-2 focus:ring-tide/20"
          />
        </div>

        {deferredSearch.length >= 2 && !selectedStopId && (
          <div className="mt-3">
            {stationsQuery.isLoading ? (
              <p className="text-sm text-slate">{t("loadingStations")}</p>
            ) : matchedStations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {matchedStations.slice(0, 12).map((s) => (
                  <button
                    key={s.stop_id}
                    type="button"
                    onClick={() => {
                      setSelectedStopId(s.stop_id);
                      setStationSearch(s.stop_name);
                    }}
                    className="rounded-full border border-ink/10 bg-mist px-4 py-2 text-xs font-semibold text-ink transition hover:bg-white"
                  >
                    {s.stop_name}
                    {s.ada_accessible ? " (ADA)" : ""}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate">{t("noStationsMatch")}</p>
            )}
          </div>
        )}

        {selectedStopId && (
          <div className="mt-4">
            {guideQuery.isLoading ? (
              <LoadingState label={t("loadingGuide")} />
            ) : guideQuery.isError ? (
              <ErrorState message={guideQuery.error.message} />
            ) : guideQuery.data ? (
              <StationAccessibilityCard guide={guideQuery.data} />
            ) : null}
          </div>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Left: Outage Feed + Equipment */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="font-display text-2xl text-ink">{t("currentOutages")}</h2>
            {outagesQuery.isLoading ? (
              <LoadingState label={t("loadingOutages")} />
            ) : outagesQuery.isError ? (
              <ErrorState message={outagesQuery.error.message} />
            ) : outages.length ? (
              <div className="space-y-4">
                {outages.map((outage) => (
                  <OutageCard key={`${outage.id}-${outage.equipment_id}`} outage={outage} />
                ))}
              </div>
            ) : (
              <EmptyState title={t("noOutages")} description={t("noOutagesDesc")} />
            )}
          </div>

          <div className="space-y-4">
            <h2 className="font-display text-2xl text-ink">{t("equipmentList")}</h2>
            {equipmentQuery.isLoading ? (
              <LoadingState label={t("loadingEquipment")} />
            ) : equipmentQuery.isError ? (
              <ErrorState message={equipmentQuery.error.message} />
            ) : equipment.length ? (
              <div className="space-y-4">
                {equipment.slice(0, 15).map((item) => (
                  <article
                    key={item.equipment_id}
                    className="rounded-[2rem] border border-white/70 bg-white/95 p-5 shadow-panel"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate">
                          {item.equipment_type || t("equipmentLabel")}
                        </p>
                        <h3 className="mt-2 font-display text-2xl text-ink">
                          {item.station_name || item.stop_id}
                        </h3>
                      </div>
                      <span className="rounded-full bg-sand/60 px-3 py-1 text-xs font-semibold text-ink">
                        {item.ada_compliant ? "ADA" : t("noAdaFlag")}
                      </span>
                    </div>
                    <p className="mt-4 text-sm text-slate">
                      {item.short_description || t("noDescription")}
                    </p>
                    <p className="mt-3 text-xs text-slate">
                      {t("linesServed")}: {item.lines_served || t("unavailable")}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title={t("noEquipment")} description={t("noEquipmentDesc")} />
            )}
          </div>
        </div>

        {/* Right: Stats Panel */}
        <div>
          <AccessibilityStats />
        </div>
      </div>
    </div>
  );
}
