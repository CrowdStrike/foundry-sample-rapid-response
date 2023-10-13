import { Temporal } from "temporal-polyfill";

const DEFAULT_ZONE = "UTC";

function now() {
  return Temporal.Now.plainDateTime("iso8601");
}

export function getCurrentTime() {
  return asPlainTime(now());
}

export function getCurrentDate() {
  return asPlainDate(now());
}

export function asPlainDate(
  input: string | Temporal.PlainDate | Temporal.PlainDateLike,
) {
  return Temporal.PlainDate.from(input).toString();
}

export function asPlainTime(
  input: string | Temporal.PlainTime | Temporal.PlainTimeLike,
) {
  return Temporal.PlainTime.from(input).toString({ smallestUnit: "minute" });
}

export function asPlainDateTime(
  input: string | Temporal.PlainDateTime | Temporal.PlainDateTimeLike,
) {
  return Temporal.PlainDateTime.from(input).toString({
    smallestUnit: "minute",
  });
}

export function asRFC3339(input: Temporal.ZonedDateTime) {
  return input.toString({
    offset: "auto",
    timeZoneName: "never",
  });
}

export function toZoned({
  timestamp,
  timezone,
}: {
  timestamp: string;
  timezone?: string;
}) {
  return Temporal.ZonedDateTime.from(
    `${timestamp}[${timezone || DEFAULT_ZONE}]`,
  );
}

export function fromParts({
  date,
  time,
  timezone,
}: {
  date: string;
  time: string;
  timezone?: string;
}) {
  const serialized = `${date}T${time}[${timezone || DEFAULT_ZONE}]`;
  return Temporal.ZonedDateTime.from(serialized);
}

export function plainDateFromParts({
  date,
  time,
}: {
  date: string;
  time: string;
}) {
  return Temporal.PlainDateTime.from(`${date}T${time}`);
}

export function getLocalDateAndTime({
  timestamp,
  timezone,
}: {
  timestamp?: string | null;
  timezone?: string;
}) {
  if (!timestamp) {
    return { date: undefined, time: undefined };
  }

  const utc = toZoned({ timestamp });
  const local = utc.withTimeZone(timezone || DEFAULT_ZONE);

  return {
    date: asPlainDate(local),
    time: asPlainTime(local),
  };
}

export type DateFormatString =
  | "YYYY-MM-DD"
  | "DD-MM-YYYY"
  | "MM-DD-YYYY"
  | "MMM. D, YYYY";
export const defaultFormat = "MMM. D, YYYY" as const;

export function isValidDateFormat(
  input?: string | null,
): input is DateFormatString {
  if (!input) {
    return false;
  }
  return ["YYYY-MM-DD", "DD-MM-YYYY", "MM-DD-YYYY", "MMM. D, YYYY"].includes(
    input,
  );
}

export function formatDate({
  datetime,
  format,
  locale,
}: {
  datetime: Temporal.ZonedDateTime;
  format?: DateFormatString;
  locale?: string;
}) {
  const effectiveFormat = format ?? defaultFormat;
  const effectiveLocale = locale ?? "en-us";
  const year = datetime.toLocaleString(effectiveLocale, { year: "numeric" });
  const month = datetime.toLocaleString(effectiveLocale, { month: "2-digit" });
  const day = datetime.toLocaleString(effectiveLocale, { day: "2-digit" });
  const monthName = datetime.toLocaleString(effectiveLocale, {
    month: "short",
  });
  const { day: shortDay } = datetime;

  if (effectiveFormat === "DD-MM-YYYY") {
    return `${day}-${month}-${year}`;
  } else if (effectiveFormat === "MM-DD-YYYY") {
    return `${month}-${day}-${year}`;
  } else if (effectiveFormat === "YYYY-MM-DD") {
    return `${year}-${month}-${day}`;
  } else if (effectiveFormat === "MMM. D, YYYY") {
    return `${monthName}. ${shortDay}, ${year}`;
  } else {
    return `${monthName}. ${shortDay}, ${year}`;
  }
}
