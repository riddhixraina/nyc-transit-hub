import { useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getEquipment, getOutages } from "../api/accessibility";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { SearchInput } from "../components/common/SearchInput";
import { SectionTitle } from "../components/common/SectionTitle";
import { OutageCard } from "../components/accessibility/OutageCard";

export function AccessibilityPage() {
  const [stationSearch, setStationSearch] = useState("");
  const deferredSearch = useDeferredValue(stationSearch);

  const equipmentQuery = useQuery({
    queryKey: ["equipment", deferredSearch],
    queryFn: () => getEquipment(deferredSearch || undefined),
    refetchInterval: 300_000,
  });

  const outagesQuery = useQuery({
    queryKey: ["outages"],
    queryFn: getOutages,
    refetchInterval: 300_000,
  });

  const equipment = equipmentQuery.data ?? [];
  const outages = outagesQuery.data ?? [];

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow="Accessibility"
        title="Elevators, escalators, and outages"
        description="The page combines equipment search with a live outage list so the accessibility feature remains useful even before a map is added."
      />

      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-panel">
        <SearchInput
          value={stationSearch}
          onChange={setStationSearch}
          placeholder="Search equipment by station name"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <h2 className="font-display text-2xl text-ink">Equipment list</h2>
          {equipmentQuery.isLoading ? (
            <LoadingState label="Loading equipment..." />
          ) : equipmentQuery.isError ? (
            <ErrorState message={equipmentQuery.error.message} />
          ) : equipment.length ? (
            <div className="space-y-4">
              {equipment.slice(0, 20).map((item) => (
                <article
                  key={item.equipment_id}
                  className="rounded-[2rem] border border-white/70 bg-white/95 p-5 shadow-panel"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate">
                        {item.equipment_type || "Equipment"}
                      </p>
                      <h3 className="mt-2 font-display text-2xl text-ink">
                        {item.station_name || item.stop_id}
                      </h3>
                    </div>
                    <span className="rounded-full bg-sand/60 px-3 py-1 text-xs font-semibold text-ink">
                      {item.ada_compliant ? "ADA" : "No ADA flag"}
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-slate">
                    {item.short_description || "No equipment description available."}
                  </p>
                  <p className="mt-3 text-xs text-slate">
                    Lines served: {item.lines_served || "Unavailable"}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No equipment records"
              description="The backend currently has no matching equipment rows."
            />
          )}
        </div>

        <div className="space-y-4">
          <h2 className="font-display text-2xl text-ink">Current outages</h2>
          {outagesQuery.isLoading ? (
            <LoadingState label="Loading outages..." />
          ) : outagesQuery.isError ? (
            <ErrorState message={outagesQuery.error.message} />
          ) : outages.length ? (
            <div className="space-y-4">
              {outages.map((outage) => (
                <OutageCard key={`${outage.id}-${outage.equipment_id}`} outage={outage} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No outage records"
              description="The backend currently has no outage rows, which usually means accessibility data has not been refreshed yet."
            />
          )}
        </div>
      </section>
    </div>
  );
}
