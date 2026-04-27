import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { AlertsPage } from "./AlertsPage";
import * as alertsApi from "../api/alerts";
import * as subwayApi from "../api/subway";

vi.mock("../api/alerts");
vi.mock("../api/subway");

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("AlertsPage", () => {
  it("renders alert cards when data loads", async () => {
    vi.mocked(alertsApi.getAlerts).mockResolvedValue([
      { id: 1, alert_id: "a1", header_text: "A train delays", description_text: "Delays on A", severity_level: "WARNING", effect: "DELAY", affected_routes: "A", affected_stops: "", active_period_start: "2026-04-01T10:00:00Z", active_period_end: "2026-04-01T12:00:00Z", fetched_at: "2026-04-01T10:00:00Z" },
    ]);
    vi.mocked(subwayApi.getRoutes).mockResolvedValue([]);
    render(<AlertsPage />, { wrapper });
    expect(await screen.findByText("A train delays")).toBeInTheDocument();
  });

  it("shows empty state when no alerts match", async () => {
    vi.mocked(alertsApi.getAlerts).mockResolvedValue([]);
    vi.mocked(subwayApi.getRoutes).mockResolvedValue([]);
    render(<AlertsPage />, { wrapper });
    expect(await screen.findByText(/no alerts match/i)).toBeInTheDocument();
  });
});
