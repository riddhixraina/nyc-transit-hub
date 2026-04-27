import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getAccessibilityStats } from "../../api/accessibility";
import { LoadingState } from "../common/LoadingState";
import { ErrorState } from "../common/ErrorState";

export function AccessibilityStats() {
  const { t } = useTranslation();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["accessibility-stats"],
    queryFn: getAccessibilityStats,
    refetchInterval: 300_000,
  });

  if (isLoading) return <LoadingState label={t("loadingStats")} />;
  if (isError) return <ErrorState message={error.message} />;
  if (!data) return null;

  const stats = [
    { label: t("adaAccessible"), value: data.ada_stations.accessible },
    { label: t("adaNotAccessible"), value: data.ada_stations.not_accessible },
    { label: t("totalElevators"), value: data.equipment.elevators },
    { label: t("totalEscalators"), value: data.equipment.escalators },
    { label: t("activeOutages"), value: data.active_outages },
    { label: t("totalEquipment"), value: data.equipment.total },
  ];

  return (
    <article className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-panel">
      <h2 className="font-display text-2xl text-ink">{t("systemStats")}</h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-mist p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate">{s.label}</p>
            <p className="mt-2 font-display text-3xl text-ink">{s.value}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
