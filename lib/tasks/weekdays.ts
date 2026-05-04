import { addDays, startOfDay } from "date-fns";

/** Monday = 0 … Sunday = 6 (matches `DAYS` in TaskForm). */
export function weekdayMon0FromDate(d: Date): number {
  return (d.getDay() + 6) % 7;
}

/** First calendar date on or after `anchor` that falls on `weekdayMon0`. */
export function firstOccurrenceOnOrAfter(anchor: Date, weekdayMon0: number): Date {
  const base = startOfDay(anchor);
  const current = weekdayMon0FromDate(base);
  const delta = (weekdayMon0 - current + 7) % 7;
  return addDays(base, delta);
}

/** Distinct first occurrence dates for each selected weekday, sorted ascending. */
export function initialInstanceDates(anchor: Date, weekdaysMon0: number[]): Date[] {
  const unique = [...new Set(weekdaysMon0)].sort((a, b) => a - b);
  const dates = unique.map((w) => firstOccurrenceOnOrAfter(anchor, w));
  dates.sort((a, b) => a.getTime() - b.getTime());
  return dates;
}
