import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { getRoutes } from "../api/subway";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { SectionTitle } from "../components/common/SectionTitle";
import { FavoriteButton } from "../components/favorites/FavoriteButton";

export function RoutesPage() {
  const { t } = useTranslation();
  const routesQuery = useQuery({
    queryKey: ["routes"],
    queryFn: getRoutes,
  });

  const routes = routesQuery.data ?? [];

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow={t("routeExplorer")}
        title={t("allSubwayLines")}
        description="Each line card links to route detail and can be favorited locally for the stage-one personalization flow."
      />

      {routesQuery.isLoading ? (
        <LoadingState label={t("loadingRoutes")} />
      ) : routesQuery.isError ? (
        <ErrorState message={routesQuery.error.message} />
      ) : routes.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {routes.map((route) => (
            <article
              key={route.route_id}
              className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-panel"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span
                    className="flex h-14 w-14 items-center justify-center rounded-2xl font-display text-xl font-semibold text-white"
                    style={{
                      backgroundColor: route.route_color
                        ? `#${route.route_color}`
                        : "#112033",
                    }}
                  >
                    {route.route_short_name || route.route_id}
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate">
                      {t("route")}
                    </p>
                    <h3 className="mt-2 font-display text-2xl text-ink">
                      {route.route_id}
                    </h3>
                  </div>
                </div>
                <FavoriteButton kind="route" value={route.route_id} />
              </div>
              <p className="mt-4 text-sm text-slate">
                {route.route_long_name || "No long name provided."}
              </p>
              <Link
                to={`/routes/${route.route_id}`}
                className="mt-5 inline-flex text-sm font-semibold text-tide"
              >
                {t("openRouteDetail")}
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title={t("noRoutesFound")}
          description="The backend did not return route metadata."
        />
      )}
    </div>
  );
}
