import { describe, expect, it } from "vitest";
import { format } from "date-fns";
import {
  firstOccurrenceOnOrAfter,
  initialInstanceDates,
  weekdayMon0FromDate,
} from "./weekdays";

function ymd(d: Date) {
  return format(d, "yyyy-MM-dd");
}

describe("weekdayMon0FromDate", () => {
  it("maps Monday Jan 13 2025 to 0", () => {
    expect(weekdayMon0FromDate(new Date(2025, 0, 13))).toBe(0);
  });
  it("maps Sunday Jan 19 2025 to 6", () => {
    expect(weekdayMon0FromDate(new Date(2025, 0, 19))).toBe(6);
  });
});

describe("firstOccurrenceOnOrAfter", () => {
  it("returns same day when anchor is that weekday", () => {
    const wed = new Date(2025, 0, 15); // Wed Jan 15 2025
    expect(ymd(firstOccurrenceOnOrAfter(wed, 2))).toBe("2025-01-15");
  });
  it("returns next matching weekday when anchor is earlier in the week", () => {
    const mon = new Date(2025, 0, 13); // Mon
    expect(ymd(firstOccurrenceOnOrAfter(mon, 4))).toBe("2025-01-17"); // Fri
  });
  it("returns following week when weekday already passed", () => {
    const fri = new Date(2025, 0, 17); // Fri
    expect(ymd(firstOccurrenceOnOrAfter(fri, 1))).toBe("2025-01-21"); // Tue after Fri
  });
});

describe("initialInstanceDates", () => {
  it("returns sorted Mon and Wed on or after Tue anchor", () => {
    const tue = new Date(2025, 0, 14); // Tue Jan 14
    const dates = initialInstanceDates(tue, [0, 2]);
    expect(dates.map(ymd)).toEqual(["2025-01-15", "2025-01-20"]);
  });
  it("dedupes duplicate weekday indices", () => {
    const mon = new Date(2025, 0, 13);
    const dates = initialInstanceDates(mon, [0, 0]);
    expect(dates.length).toBe(1);
    expect(ymd(dates[0]!)).toBe("2025-01-13");
  });
});
