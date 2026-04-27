import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { FavoritesPage } from "./FavoritesPage";
import * as subwayApi from "../api/subway";

vi.mock("../api/subway");
vi.mock("../lib/favorites", () => ({
  useFavorites: () => ({ stopIds: [], routeIds: [], toggleStop: vi.fn(), toggleRoute: vi.fn() }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("FavoritesPage", () => {
  it("shows empty state when no favorites saved", async () => {
    vi.mocked(subwayApi.getRoutes).mockResolvedValue([]);
    vi.mocked(subwayApi.getStops).mockResolvedValue([]);
    render(<FavoritesPage />, { wrapper });
    expect(await screen.findByText(/no favorites yet/i)).toBeInTheDocument();
  });
});
