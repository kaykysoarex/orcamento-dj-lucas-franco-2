/**
 * Formats an ISO date string (YYYY-MM-DD) to Portuguese (BR) format.
 * Avoids timezone issues by parsing the date as local.
 * Returns empty string if the input is empty or invalid.
 */
export function formatEventDate(isoDate: string): string {
  if (!isoDate || typeof isoDate !== "string") {
    return "";
  }

  const trimmed = isoDate.trim();
  if (!trimmed) {
    return "";
  }

  try {
    // Parse as YYYY-MM-DD to avoid UTC conversion
    const [year, month, day] = trimmed.split("-").map(Number);

    if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
      return "";
    }

    // Use local date (not UTC)
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}
