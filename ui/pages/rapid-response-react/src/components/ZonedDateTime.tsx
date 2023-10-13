import {
  DateFormatString,
  asPlainTime,
  formatDate,
  toZoned,
} from "@/lib/utils/datetime";

interface ZonedDateTimeProps {
  /** A datetime in UTC timezone */
  timestamp?: string;
  options: {
    /** The timezone in which the provided timestamp should be output */
    timezone?: string;
    /** The format string  */
    dateFormat?: DateFormatString;
    /** The user's preferred locale  */
    locale?: string;
  };
}

/**
 * Component for showing a datetime in a given timezone
 *
 * The timestamp argument should represent a date and time in UTC timezone.
 *
 * The timezone argument represents the User's preferred timezone, which is
 * how the date and time will be represented on screen for the user.
 *
 * Example usage:
 *
 *     <ZonedDateTime
 *       timestamp="2023-12-01T23:30"
 *       options={{
 *         format: "YYYY-MM-DD",
 *         timezone: "Europe/Paris",
 *         locale: "fr"
 *       }}
 *     />
 *
 * The timestamp represents 30 minutes _before_ the new year in UTC timezone.
 * In Paris, that would be 30 minutes _after_ the new year. The output would be:
 *
 *     <time datetime="2023-12-01T23:30[UTC]">
 *       2024-01-01 00:30[Europe/Paris]
 *     </time>
 *
 */
export function ZonedDateTime({ timestamp, options }: ZonedDateTimeProps) {
  if (!timestamp) {
    return "- -";
  }

  try {
    const { timezone, dateFormat, locale } = options;
    const effectiveTimezone = timezone || "UTC";
    const utc = toZoned({ timestamp, timezone: "UTC" });
    const local = utc.withTimeZone(effectiveTimezone);

    const localDate = formatDate({
      datetime: local,
      format: dateFormat,
      locale,
    });
    const localTime = asPlainTime(local);

    return (
      <time role="time" dateTime={utc.toString()}>
        {localDate} {localTime} [{effectiveTimezone}]
      </time>
    );
  } catch (_) {
    return "- -";
  }
}
