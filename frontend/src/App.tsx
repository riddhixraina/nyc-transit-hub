import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AccessibilityPage } from "./pages/AccessibilityPage";
import { AlertsPage } from "./pages/AlertsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { LoginPage } from "./pages/LoginPage";
import { RouteDetailPage } from "./pages/RouteDetailPage";
import { RoutesPage } from "./pages/RoutesPage";
import { StationDetailPage } from "./pages/StationDetailPage";
import { StationsPage } from "./pages/StationsPage";
import { TripPlannerPage } from "./pages/TripPlannerPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<TripPlannerPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/accessibility" element={<AccessibilityPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/stations" element={<StationsPage />} />
        <Route path="/stations/:stopId" element={<StationDetailPage />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/routes/:routeId" element={<RouteDetailPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>
    </Routes>
  );
}
