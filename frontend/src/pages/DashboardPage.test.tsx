import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardPage } from "./DashboardPage";
import * as statusApi from "../api/status";
import * as alertsApi from "../api/alerts";

vi.mock("../api/status");
vi.mock("../api/alerts");

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("DashboardPage", () => {
  it("renders summary cards and route status data", async () => {
    vi.mocked(statusApi.getStatusSummary).mockResolvedValue({
      total_lines: 2,
      breakdown: {
        "Good Service": 1,
        Delays: 1,
      },
    });
    vi.mocked(statusApi.getRouteStatuses).mockResolvedValue([
      {
        route_id: "A",
        route_short_name: "A",
        route_color: "2850AD",
        status: "Delays",
        alert_count: 1,
        alerts: [
          {
            alert_id: "alert_1",
            header_text: "A train delays",
            effect: "SIGNIFICANT_DELAYS",
          },
        ],
      },
    ]);
    vi.mocked(alertsApi.getAlerts).mockResolvedValue([
      {
        alert_id: "alert_1",
        header_text: "A train delays",
        description_text: "Signal issue",
        severity_level: "WARNING",
        effect: "SIGNIFICANT_DELAYS",
        affected_routes: "A",
        affected_stops: "A15",
        active_period_start: "2026-03-30T10:00:00+00:00",
        active_period_end: "2026-03-30T14:00:00+00:00",
        fetched_at: "2026-03-30T12:00:00+00:00",
      },
    ]);

    renderPage();

    expect(await screen.findByText("System dashboard")).toBeInTheDocument();
    expect(await screen.findByText("Total lines")).toBeInTheDocument();
    expect(await screen.findAllByText("A train delays")).toHaveLength(2);
  });
});
