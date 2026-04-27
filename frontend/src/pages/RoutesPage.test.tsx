import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { RoutesPage } from "./RoutesPage";
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

describe("RoutesPage", () => {
  it("renders route cards when data loads", async () => {
    vi.mocked(subwayApi.getRoutes).mockResolvedValue([
      { route_id: "A", route_short_name: "A", route_long_name: "Eighth Avenue Express", route_color: "0039A6", route_text_color: "FFFFFF" },
    ]);
    render(<RoutesPage />, { wrapper });
    expect(await screen.findByText("Eighth Avenue Express")).toBeInTheDocument();
  });

  it("shows empty state when no routes returned", async () => {
    vi.mocked(subwayApi.getRoutes).mockResolvedValue([]);
    render(<RoutesPage />, { wrapper });
    expect(await screen.findByText(/no routes found/i)).toBeInTheDocument();
  });
});
