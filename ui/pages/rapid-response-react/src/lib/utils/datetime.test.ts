import { Temporal } from "temporal-polyfill";
import {
  asRFC3339,
  formatDate,
  getLocalDateAndTime,
  toZoned,
} from "@/lib/utils/datetime";

import { describe, expect, test } from "vitest";

const summerDate = "2023-09-18T16:30";
const winterDate = "2023-12-18T09:00";

// Find example tz database timezones here: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
const london = "Europe/London";
const paris = "Europe/Paris";
const nyc = "America/New_York";
const sydney = "Australia/Sydney";

describe("toZoned method", () => {
  describe("summertime dates", () => {
    (
      [
        ["UTC", undefined, "2023-09-18T16:30:00+00:00[UTC]"],
        ["London", london, "2023-09-18T16:30:00+01:00[Europe/London]"],
        ["Paris", paris, "2023-09-18T16:30:00+02:00[Europe/Paris]"],
        ["Sydney", sydney, "2023-09-18T16:30:00+10:00[Australia/Sydney]"],
        ["New York", nyc, "2023-09-18T16:30:00-04:00[America/New_York]"],
      ] as const
    ).forEach(([label, zone, expected]) => {
      test(label, () => {
        expect(
          toZoned({ timestamp: summerDate, timezone: zone }).toString(),
        ).toEqual(expected);
      });
    });
  });

  describe("wintertime dates", () => {
    (
      [
        ["UTC", undefined, "2023-12-18T09:00:00+00:00[UTC]"],
        ["London", london, "2023-12-18T09:00:00+00:00[Europe/London]"],
        ["Paris", paris, "2023-12-18T09:00:00+01:00[Europe/Paris]"],
        ["Sydney", sydney, "2023-12-18T09:00:00+11:00[Australia/Sydney]"],
        ["New York", nyc, "2023-12-18T09:00:00-05:00[America/New_York]"],
      ] as const
    ).forEach(([label, zone, expected]) => {
      test(label, () => {
        expect(
          toZoned({ timestamp: winterDate, timezone: zone }).toString(),
        ).toEqual(expected);
      });
    });
  });

  describe("Bad inputs", () => {
    test("Malformed timestamp", () => {
      expect(() => {
        toZoned({ timestamp: "asdf" });
      }).toThrow(new RangeError("Cannot parse dateTime 'asdf[UTC]'"));
    });

    test("Invalid date", () => {
      expect(() => {
        toZoned({ timestamp: "2023-13-32T25:61" });
      }).toThrow(new RangeError("Invalid overflowed value 13"));
    });

    test("Invalid timezone", () => {
      expect(() => {
        toZoned({ timestamp: summerDate, timezone: "Moon/Sea_Of_Tranquility" });
      }).toThrow(
        new RangeError("Invalid time zone specified: Moon/Sea_Of_Tranquility"),
      );
    });
  });
});

describe("getLocalDateAndTime", () => {
  test("Takes UTC timestamp and a timezone as input, returns date/time in that timezone", () => {
    const result = getLocalDateAndTime({
      timestamp: "2023-12-31T23:30",
      timezone: "Europe/Paris",
    });
    expect(result.date).toBe("2024-01-01");
    expect(result.time).toBe("00:30");
  });
});

describe("formatDate", () => {
  const dec31 = Temporal.ZonedDateTime.from("2023-12-31T23:30[UTC]");
  const jan01 = Temporal.ZonedDateTime.from("2024-01-01T00:30[UTC]");

  test("returns the date as a string", () => {
    expect(formatDate({ datetime: dec31 })).toBe("Dec. 31, 2023");
    expect(formatDate({ datetime: dec31, format: "MMM. D, YYYY" })).toBe(
      "Dec. 31, 2023",
    );
    expect(formatDate({ datetime: dec31, format: "YYYY-MM-DD" })).toBe(
      "2023-12-31",
    );
    expect(formatDate({ datetime: dec31, format: "DD-MM-YYYY" })).toBe(
      "31-12-2023",
    );
    expect(formatDate({ datetime: dec31, format: "MM-DD-YYYY" })).toBe(
      "12-31-2023",
    );

    expect(formatDate({ datetime: jan01 })).toBe("Jan. 1, 2024");
    expect(formatDate({ datetime: jan01, format: "MMM. D, YYYY" })).toBe(
      "Jan. 1, 2024",
    );
    expect(formatDate({ datetime: jan01, format: "YYYY-MM-DD" })).toBe(
      "2024-01-01",
    );
    expect(formatDate({ datetime: jan01, format: "DD-MM-YYYY" })).toBe(
      "01-01-2024",
    );
    expect(formatDate({ datetime: jan01, format: "MM-DD-YYYY" })).toBe(
      "01-01-2024",
    );
  });
});

describe("asRFC3339", () => {
  const dec31UTC = Temporal.ZonedDateTime.from("2023-12-31T23:30[UTC]");
  const jan01UTC = Temporal.ZonedDateTime.from("2024-01-01T00:30[UTC]");
  const jan01Paris = Temporal.ZonedDateTime.from(
    "2024-01-01T00:30[Europe/Paris]",
  );

  test("returns the date as a string", () => {
    expect(asRFC3339(dec31UTC)).toBe("2023-12-31T23:30:00+00:00");
    expect(asRFC3339(jan01UTC)).toBe("2024-01-01T00:30:00+00:00");
    expect(asRFC3339(jan01Paris)).toBe("2024-01-01T00:30:00+01:00");
  });
});
