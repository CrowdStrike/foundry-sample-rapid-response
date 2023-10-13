import { render, screen } from "@testing-library/react";
import { ZonedDateTime } from "@/components/ZonedDateTime";
import { describe, expect, test } from "vitest";

describe("ZonedDateTime", () => {
  test("renders timezone provided", () => {
    render(
      <ZonedDateTime
        timestamp="2023-12-31T23:45"
        options={{ timezone: "Europe/Paris" }}
      />,
    );

    const element = screen.getByRole("time");
    expect(element.getAttribute("datetime")).toBe(
      "2023-12-31T23:45:00+00:00[UTC]",
    );

    expect(element.innerHTML).toBe("Jan. 1, 2024 00:45 [Europe/Paris]");
  });

  test("renders timezone provided", () => {
    render(
      <ZonedDateTime
        timestamp="2023-12-31T23:45"
        options={{ timezone: "Europe/Paris", dateFormat: "DD-MM-YYYY" }}
      />,
    );

    const element = screen.getByRole("time");
    expect(element.getAttribute("datetime")).toBe(
      "2023-12-31T23:45:00+00:00[UTC]",
    );

    expect(element.innerHTML).toBe("01-01-2024 00:45 [Europe/Paris]");
  });
});
