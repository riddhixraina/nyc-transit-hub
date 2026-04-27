import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getRoutes, getStops } from "../api/subway";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { SectionTitle } from "../components/common/SectionTitle";
import { StopCard } from "../components/subway/StopCard";
import { useFavorites } from "../lib/favorites";

export function FavoritesPage() {
  const { t } = useTranslation();
  const favorites = useFavorites();

  const routesQuery = useQuery({
    queryKey: ["routes"],
    queryFn: getRoutes,
  });

  const stopsQuery = useQuery({
    queryKey: ["stops"],
    queryFn: () => getStops(),
  });

  if (routesQuery.isLoading || stopsQuery.isLoading) {
    return <LoadingState label={t("loadingFavorites")} />;
  }

  if (routesQuery.isError) {
    return <ErrorState message={routesQuery.error.message} />;
  }

  if (stopsQuery.isError) {
    return <ErrorState message={stopsQuery.error.message} />;
  }

  const routes = routesQuery.data ?? [];
  const stops = stopsQuery.data ?? [];

  const favoriteRoutes = routes.filter((route) =>
    favorites.routeIds.includes(route.route_id),
  );
  const favoriteStops = stops.filter((stop) =>
    favorites.stopIds.includes(stop.stop_id),
  );

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow={t("favorites")}
        title={t("savedLocally")}
        description={t("favoritesPageDesc")}
      />

      {!favoriteRoutes.length && !favoriteStops.length ? (
        <EmptyState
          title={t("noFavoritesYet")}
          description={t("favoritesEmptyDesc")}
        />
      ) : null}

      {favoriteRoutes.length ? (
        <section className="space-y-4">
          <h2 className="font-display text-2xl text-ink">{t("favoriteRoutes")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {favoriteRoutes.map((route) => (
              <article
                key={route.route_id}
                className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-panel"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-slate">
                  {t("route")}
                </p>
                <h3 className="mt-2 font-display text-3xl text-ink">
                  {route.route_id}
                </h3>
                <p className="mt-2 text-sm text-slate">
                  {route.route_long_name || t("noLongName")}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {favoriteStops.length ? (
        <section className="space-y-4">
          <h2 className="font-display text-2xl text-ink">{t("favoriteStations")}</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {favoriteStops.map((stop) => (
              <StopCard key={stop.stop_id} stop={stop} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
