const STORAGE_KEY = "nyc-transit-hub:favorites";

export type FavoriteState = {
  stopIds: string[];
  routeIds: string[];
};

export function readFavoriteState(): FavoriteState {
  if (typeof window === "undefined") {
    return { stopIds: [], routeIds: [] };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { stopIds: [], routeIds: [] };
  }

  try {
    const parsed = JSON.parse(raw) as FavoriteState;
    return {
      stopIds: parsed.stopIds ?? [],
      routeIds: parsed.routeIds ?? [],
    };
  } catch {
    return { stopIds: [], routeIds: [] };
  }
}

export function writeFavoriteState(value: FavoriteState) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}
