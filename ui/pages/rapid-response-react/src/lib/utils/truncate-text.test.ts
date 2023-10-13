import { describe, expect, test } from "vitest";
import { truncateText } from "@/lib/utils/truncate-text";

describe("truncate-text module", () => {
  test("Given a short string, returns string unchanged", () => {
    const lorem = "Lorem ipsum dolor sit amet";
    expect(truncateText(lorem)).toBe("Lorem ipsum dolor sit amet");
  });

  test("Given a long string, returns elided string", () => {
    const lorem =
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur erat lacus, congue non suscipit nec, vulputate eget turpis.";
    expect(truncateText(lorem)).toBe(
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur era...",
    );
  });
});
