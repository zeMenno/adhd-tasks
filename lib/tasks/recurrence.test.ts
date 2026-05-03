import { format } from "date-fns";
import { describe, expect, it } from "vitest";
import {
  calculateDaysOverdue,
  calculateEarnedPoints,
  getNextDueDate,
  shouldCreateNewInstance,
} from "./recurrence";

// Use local date constructor (not UTC ISO strings) to avoid timezone shifts
const BASE = new Date(2025, 0, 15); // Jan 15, 2025 local midnight

// Format a date as YYYY-MM-DD in local time
function ymd(d: Date) {
  return format(d, "yyyy-MM-dd");
}

// ─── getNextDueDate ────────────────────────────────────────────────────────────

describe("getNextDueDate", () => {
  it("returns null for 'once' tasks", () => {
    expect(getNextDueDate("once", BASE)).toBeNull();
  });

  it("returns next day for 'daily'", () => {
    expect(ymd(getNextDueDate("daily", BASE)!)).toBe("2025-01-16");
  });

  it("returns 7 days later for 'weekly'", () => {
    expect(ymd(getNextDueDate("weekly", BASE)!)).toBe("2025-01-22");
  });

  it("returns 14 days later for 'biweekly'", () => {
    expect(ymd(getNextDueDate("biweekly", BASE)!)).toBe("2025-01-29");
  });

  it("returns 1 month later for 'monthly' (same day of month)", () => {
    expect(ymd(getNextDueDate("monthly", BASE)!)).toBe("2025-02-15");
  });

  it("monthly wraps correctly for end-of-month dates", () => {
    const jan31 = new Date(2025, 0, 31);
    // Feb has no 31st — date-fns clamps to Feb 28
    expect(ymd(getNextDueDate("monthly", jan31)!)).toBe("2025-02-28");
  });
});

// ─── calculateDaysOverdue ──────────────────────────────────────────────────────

describe("calculateDaysOverdue", () => {
  it("returns 0 when due today", () => {
    expect(calculateDaysOverdue(BASE, BASE)).toBe(0);
  });

  it("returns 0 when due in the future", () => {
    const tomorrow = new Date(2025, 0, 16);
    expect(calculateDaysOverdue(tomorrow, BASE)).toBe(0);
  });

  it("returns 1 when 1 day overdue", () => {
    const yesterday = new Date(2025, 0, 14);
    expect(calculateDaysOverdue(yesterday, BASE)).toBe(1);
  });

  it("returns 5 when 5 days overdue", () => {
    const fiveDaysAgo = new Date(2025, 0, 10);
    expect(calculateDaysOverdue(fiveDaysAgo, BASE)).toBe(5);
  });

  it("ignores time-of-day differences", () => {
    const dueDate   = new Date(2025, 0, 14, 0, 0, 0);  // Jan 14 midnight local
    const todayLate = new Date(2025, 0, 15, 23, 59, 59); // Jan 15 23:59 local
    expect(calculateDaysOverdue(dueDate, todayLate)).toBe(1);
  });
});

// ─── calculateEarnedPoints ────────────────────────────────────────────────────

describe("calculateEarnedPoints", () => {
  it("returns full points when not overdue", () => {
    expect(calculateEarnedPoints(10, 2, 0)).toBe(10);
  });

  it("deducts penalty correctly (2 days overdue)", () => {
    expect(calculateEarnedPoints(10, 2, 2)).toBe(6);
  });

  it("floors at 0 — never returns negative points", () => {
    expect(calculateEarnedPoints(10, 2, 10)).toBe(0);
    expect(calculateEarnedPoints(10, 2, 99)).toBe(0);
  });

  it("handles zero penalty per day", () => {
    expect(calculateEarnedPoints(10, 0, 7)).toBe(10);
  });

  it("handles high base points", () => {
    expect(calculateEarnedPoints(100, 5, 3)).toBe(85);
  });
});

// ─── shouldCreateNewInstance ──────────────────────────────────────────────────

describe("shouldCreateNewInstance", () => {
  it("never creates for 'once' regardless of status or approval", () => {
    expect(shouldCreateNewInstance("once", "done",      false)).toBe(false);
    expect(shouldCreateNewInstance("once", "completed", false)).toBe(false);
    expect(shouldCreateNewInstance("once", "approved",  true )).toBe(false);
    expect(shouldCreateNewInstance("once", "todo",      false)).toBe(false);
  });

  describe("requiresApproval = false", () => {
    it("creates after 'done'", () => {
      expect(shouldCreateNewInstance("daily", "done", false)).toBe(true);
    });

    it("creates after 'completed'", () => {
      expect(shouldCreateNewInstance("weekly", "completed", false)).toBe(true);
    });

    it("does NOT create while 'todo'", () => {
      expect(shouldCreateNewInstance("daily", "todo", false)).toBe(false);
    });

    it("does NOT create while 'approved'", () => {
      expect(shouldCreateNewInstance("monthly", "approved", false)).toBe(false);
    });
  });

  describe("requiresApproval = true", () => {
    it("creates after 'approved'", () => {
      expect(shouldCreateNewInstance("daily", "approved", true)).toBe(true);
    });

    it("creates after 'completed'", () => {
      expect(shouldCreateNewInstance("weekly", "completed", true)).toBe(true);
    });

    it("does NOT create after 'done' — still needs owner approval", () => {
      expect(shouldCreateNewInstance("biweekly", "done", true)).toBe(false);
    });

    it("does NOT create while 'todo'", () => {
      expect(shouldCreateNewInstance("monthly", "todo", true)).toBe(false);
    });
  });

  it("works for all recurring types", () => {
    const types = ["daily", "weekly", "biweekly", "monthly"] as const;
    for (const type of types) {
      expect(shouldCreateNewInstance(type, "done",      false)).toBe(true);
      expect(shouldCreateNewInstance(type, "todo",      false)).toBe(false);
      expect(shouldCreateNewInstance(type, "approved",  true )).toBe(true);
      expect(shouldCreateNewInstance(type, "todo",      true )).toBe(false);
    }
  });
});
