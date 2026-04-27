import { Star } from "lucide-react";
import { cn } from "../../lib/utils";
import { useFavorites } from "../../lib/favorites";

type FavoriteButtonProps = {
  kind: "stop" | "route";
  value: string;
};

export function FavoriteButton({ kind, value }: FavoriteButtonProps) {
  const favorites = useFavorites();
  const active =
    kind === "stop"
      ? favorites.isFavoriteStop(value)
      : favorites.isFavoriteRoute(value);

  function toggle() {
    if (kind === "stop") {
      favorites.toggleStop(value);
      return;
    }
    favorites.toggleRoute(value);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "rounded-full border px-3 py-2 transition",
        active
          ? "border-sand bg-sand/60 text-ink"
          : "border-ink/10 bg-white text-slate hover:border-tide hover:text-tide",
      )}
      aria-label={`Toggle favorite ${value}`}
    >
      <Star className={cn("h-4 w-4", active && "fill-current")} />
    </button>
  );
}
