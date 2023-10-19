/**
 * Truncate a text that is longer than 49 characters.
 * Usually used in the application to shorten the description field
 * of Tables.
 */
export function truncateText(text: string): string {
  return text.replace(/(.{70})..+/, "$1...");
}
