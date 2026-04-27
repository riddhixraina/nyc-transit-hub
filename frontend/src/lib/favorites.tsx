import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import {
  readFavoriteState,
  writeFavoriteState,
  type FavoriteState,
} from "../api/favorites";

type FavoritesContextValue = FavoriteState & {
  toggleStop: (stopId: string) => void;
  toggleRoute: (routeId: string) => void;
  isFavoriteStop: (stopId: string) => boolean;
  isFavoriteRoute: (routeId: string) => boolean;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: PropsWithChildren) {
  const [favorites, setFavorites] = useState<FavoriteState>(readFavoriteState);

  useEffect(() => {
    writeFavoriteState(favorites);
  }, [favorites]);

  useEffect(() => {
    function onStorage() {
      setFavorites(readFavoriteState());
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function toggleStop(stopId: string) {
    setFavorites((current) => ({
      ...current,
      stopIds: current.stopIds.includes(stopId)
        ? current.stopIds.filter((value) => value !== stopId)
        : [...current.stopIds, stopId],
    }));
  }

  function toggleRoute(routeId: string) {
    setFavorites((current) => ({
      ...current,
      routeIds: current.routeIds.includes(routeId)
        ? current.routeIds.filter((value) => value !== routeId)
        : [...current.routeIds, routeId],
    }));
  }

  function isFavoriteStop(stopId: string) {
    return favorites.stopIds.includes(stopId);
  }

  function isFavoriteRoute(routeId: string) {
    return favorites.routeIds.includes(routeId);
  }

  return (
    <FavoritesContext.Provider
      value={{
        ...favorites,
        toggleStop,
        toggleRoute,
        isFavoriteStop,
        isFavoriteRoute,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return context;
}
