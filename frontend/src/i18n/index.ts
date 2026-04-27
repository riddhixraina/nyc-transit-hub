import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      home: "Home",
      dashboard: "Dashboard",
      stations: "Stations",
      routes: "Routes",
      alerts: "Alerts",
      accessibility: "Accessibility",
      favorites: "Favorites",
      login: "Login",
      goodService: "Good Service",
      delays: "Delays",
      serviceChange: "Service Change",
      suspended: "Suspended",
      plannedWork: "Planned Work",
      lineStatus: "Line Status",
      arrivals: "Arrivals",
      searchPlaceholder: "Search stations or routes",
      saveFavorites: "Save favorites locally",
      signIn: "Sign in",
      signOut: "Sign out",
      english: "English",
      spanish: "Spanish",
    },
  },
  es: {
    translation: {
      home: "Inicio",
      dashboard: "Panel",
      stations: "Estaciones",
      routes: "Líneas",
      alerts: "Alertas",
      accessibility: "Accesibilidad",
      favorites: "Favoritos",
      login: "Acceso",
      goodService: "Buen servicio",
      delays: "Retrasos",
      serviceChange: "Cambio de servicio",
      suspended: "Suspendido",
      plannedWork: "Trabajo planificado",
      lineStatus: "Estado de líneas",
      arrivals: "Llegadas",
      searchPlaceholder: "Buscar estaciones o líneas",
      saveFavorites: "Guardar favoritos localmente",
      signIn: "Entrar",
      signOut: "Salir",
      english: "Inglés",
      spanish: "Español",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
