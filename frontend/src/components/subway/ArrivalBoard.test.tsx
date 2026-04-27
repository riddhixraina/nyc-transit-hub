import { render, screen } from "@testing-library/react";
import { ArrivalBoard } from "./ArrivalBoard";

describe("ArrivalBoard", () => {
  it("shows an empty state when no arrivals exist", () => {
    render(<ArrivalBoard arrivals={[]} />);

    expect(screen.getByText("No arrivals cached")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The backend does not currently have any upcoming arrivals for this stop.",
      ),
    ).toBeInTheDocument();
  });
});
