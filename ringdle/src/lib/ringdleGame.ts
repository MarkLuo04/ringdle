// Daily Ringdle max guesses
export const MAX_GUESSES = 8;

// First Ringdle launch date
export const RINGDLE_LAUNCH_DATE = "2026-05-14";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

// get yesterday's date in UTC
export function getYesterdayUTC(): string {
  const parts = getTodayUTC().split("-").map(Number);
  const y = parts[0] ?? 1970;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

function compareYyyyMmDd(a: string, b: string): number {
  return a.localeCompare(b);
}

// Past archive dates only
export function isValidArchiveDate(date: string): boolean {
  if (!DATE_RE.test(date)) return false;
  if (compareYyyyMmDd(date, RINGDLE_LAUNCH_DATE) < 0) return false;
  if (compareYyyyMmDd(date, getTodayUTC()) >= 0) return false;
  return true;
}

// format the date for the archive label
export function formatArchiveLabel(date: string): string {
  const parts = date.split("-").map(Number);
  const y = parts[0] ?? 1970;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

// get the storage prefix for the archive game
export function archiveStoragePrefix(date: string): string {
  return `ringdle-archive-${date}`;
}
