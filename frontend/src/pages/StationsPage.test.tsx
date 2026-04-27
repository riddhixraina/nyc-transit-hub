import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { StationsPage } from "./StationsPage";
import * as subwayApi from "../api/subway";

vi.mock("../api/subway");
vi.mock("../lib/favorites", () => ({
  useFavorites: () => ({ stopIds: [], routeIds: [], toggleStop: vi.fn(), toggleRoute: vi.fn(), isFavoriteStop: () => false, isFavoriteRoute: () => false }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("StationsPage", () => {
  it("renders station cards when data loads", async () => {
    vi.mocked(subwayApi.getStops).mockResolvedValue([
      { stop_id: "101", stop_name: "Van Cortlandt Park", stop_lat: 40.88, stop_lon: -73.89, parent_station: "", ada_accessible: 1, ada_notes: "", borough: "Bronx", daytime_routes: "1" },
    ]);
    vi.mocked(subwayApi.getRoutes).mockResolvedValue([
      { route_id: "1", route_short_name: "1", route_long_name: "Broadway Local", route_color: "EE352E", route_text_color: "FFFFFF" },
    ]);
    render(<StationsPage />, { wrapper });
    expect(await screen.findByText("Van Cortlandt Park")).toBeInTheDocument();
  });

  it("shows empty state when no stations match", async () => {
    vi.mocked(subwayApi.getStops).mockResolvedValue([]);
    vi.mocked(subwayApi.getRoutes).mockResolvedValue([]);
    render(<StationsPage />, { wrapper });
    expect(await screen.findByText(/no stations match/i)).toBeInTheDocument();
  });
});
