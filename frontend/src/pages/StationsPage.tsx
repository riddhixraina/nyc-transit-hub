import { useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getRoutes, getStops } from "../api/subway";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { SearchInput } from "../components/common/SearchInput";
import { SectionTitle } from "../components/common/SectionTitle";
import { StopCard } from "../components/subway/StopCard";

export function StationsPage() {
  const { t } = useTranslation();
  const [routeFilter, setRouteFilter] = useState("");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const stopsQuery = useQuery({
    queryKey: ["stops", routeFilter],
    queryFn: () => getStops(routeFilter || undefined),
  });

  const routesQuery = useQuery({
    queryKey: ["routes"],
    queryFn: getRoutes,
  });

  const visibleStops =
    stopsQuery.data?.filter((stop) => {
      const term = deferredSearch.trim().toLowerCase();
      if (!term) {
        return true;
      }
      return (
        stop.stop_name.toLowerCase().includes(term) ||
        stop.stop_id.toLowerCase().includes(term) ||
        stop.daytime_routes.toLowerCase().includes(term)
      );
    }) ?? [];

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow={t("stationExplorer")}
        title={t("browseStops")}
        description="This page uses the stops endpoint first, then applies route and text filters on top of the cached station list."
      />

      <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-panel">
        <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t("searchStations")}
          />
          <select
            value={routeFilter}
            onChange={(event) => setRouteFilter(event.target.value)}
            className="rounded-full border border-ink/10 bg-white px-5 py-3 text-sm text-ink outline-none"
          >
            <option value="">{t("allRoutes")}</option>
            {routesQuery.data?.map((route) => (
              <option key={route.route_id} value={route.route_id}>
                {route.route_id}
              </option>
            ))}
          </select>
        </div>
      </section>

      {stopsQuery.isLoading ? (
        <LoadingState label={t("loadingStations")} />
      ) : stopsQuery.isError ? (
        <ErrorState message={stopsQuery.error.message} />
      ) : visibleStops.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleStops.map((stop) => (
            <StopCard key={stop.stop_id} stop={stop} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={t("noStationsMatch")}
          description="Adjust the route filter or search term to see matching stations."
        />
      )}
    </div>
  );
}
