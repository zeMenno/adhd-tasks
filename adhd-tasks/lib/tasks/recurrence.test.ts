import { describe, expect, it } from "vitest";
import {
  calculateDaysOverdue,
  calculateEarnedPoints,
  getNextDueDate,
  shouldCreateNewInstance,
} from "./recurrence";

// Fixed reference date for all tests
const BASE = new Date("2025-01-15T00:00:00.000Z");

// ─── getNextDueDate ────────────────────────────────────────────────────────────

describe("getNextDueDate", () => {
  it("returns null for 'once' tasks", () => {
    expect(getNextDueDate("once", BASE)).toBeNull();
  });

  it("returns next day for 'daily'", () => {
    const next = getNextDueDate("daily", BASE)!;
    expect(next.toISOString().slice(0, 10)).toBe("2025-01-16");
  });

  it("returns 7 days later for 'weekly'", () => {
    const next = getNextDueDate("weekly", BASE)!;
    expect(next.toISOString().slice(0, 10)).toBe("2025-01-22");
  });

  it("returns 14 days later for 'biweekly'", () => {
    const next = getNextDueDate("biweekly", BASE)!;
    expect(next.toISOString().slice(0, 10)).toBe("2025-01-29");
  });

  it("returns 1 month later for 'monthly' (same day of month)", () => {
    const next = getNextDueDate("monthly", BASE)!;
    expect(next.toISOString().slice(0, 10)).toBe("2025-02-15");
  });

  it("monthly wraps correctly for end-of-month dates", () => {
    const jan31 = new Date("2025-01-31T00:00:00.000Z");
    const next = getNextDueDate("monthly", jan31)!;
    // Feb has no 31st — date-fns clamps to Feb 28
    expect(next.toISOString().slice(0, 10)).toBe("2025-02-28");
  });
});

// ─── calculateDaysOverdue ──────────────────────────────────────────────────────

describe("calculateDaysOverdue", () => {
  it("returns 0 when due today", () => {
    expect(calculateDaysOverdue(BASE, BASE)).toBe(0);
  });

  it("returns 0 when due in the future", () => {
    const tomorrow = new Date("2025-01-16T00:00:00.000Z");
    expect(calculateDaysOverdue(tomorrow, BASE)).toBe(0);
  });

  it("returns 1 when 1 day overdue", () => {
    const yesterday = new Date("2025-01-14T00:00:00.000Z");
    expect(calculateDaysOverdue(yesterday, BASE)).toBe(1);
  });

  it("returns 5 when 5 days overdue", () => {
    const fiveDaysAgo = new Date("2025-01-10T00:00:00.000Z");
    expect(calculateDaysOverdue(fiveDaysAgo, BASE)).toBe(5);
  });

  it("ignores time-of-day differences", () => {
    const dueDateMidnight = new Date("2025-01-14T00:00:00.000Z");
    const todayEvening   = new Date("2025-01-15T23:59:59.000Z");
    expect(calculateDaysOverdue(dueDateMidnight, todayEvening)).toBe(1);
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
  // 'once' tasks never get a new instance
  it("never creates for 'once' regardless of status or approval", () => {
    expect(shouldCreateNewInstance("once", "done",      false)).toBe(false);
    expect(shouldCreateNewInstance("once", "completed", false)).toBe(false);
    expect(shouldCreateNewInstance("once", "approved",  true )).toBe(false);
    expect(shouldCreateNewInstance("once", "todo",      false)).toBe(false);
  });

  // Without approval required
  describe("requiresApproval = false", () => {
    it("creates after 'done'", () => {
      expect(shouldCreateNewInstance("daily", "done", false)).toBe(true);
    });

    it("creates after 'completed'", () => {
      expect(shouldCreateNewInstance("weekly", "completed", false)).toBe(true);
    });

    it("does NOT create while still 'todo'", () => {
      expect(shouldCreateNewInstance("daily", "todo", false)).toBe(false);
    });

    it("does NOT create while 'approved' (already waiting approval of a non-approval task, edge case)", () => {
      expect(shouldCreateNewInstance("monthly", "approved", false)).toBe(false);
    });
  });

  // With approval required
  describe("requiresApproval = true", () => {
    it("creates after 'approved'", () => {
      expect(shouldCreateNewInstance("daily", "approved", true)).toBe(true);
    });

    it("creates after 'completed'", () => {
      expect(shouldCreateNewInstance("weekly", "completed", true)).toBe(true);
    });

    it("does NOT create after 'done' (still needs owner approval)", () => {
      expect(shouldCreateNewInstance("biweekly", "done", true)).toBe(false);
    });

    it("does NOT create while 'todo'", () => {
      expect(shouldCreateNewInstance("monthly", "todo", true)).toBe(false);
    });
  });

  // All recurrence types work the same way (spot checks)
  it("works for all recurring types", () => {
    const types = ["daily", "weekly", "biweekly", "monthly"] as const;
    for (const type of types) {
      expect(shouldCreateNewInstance(type, "done", false)).toBe(true);
      expect(shouldCreateNewInstance(type, "todo", false)).toBe(false);
    }
  });
});
