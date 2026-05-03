import { describe, expect, it } from "vitest";
import { buildNotificationPayload } from "./phases";

describe("buildNotificationPayload", () => {
  it("phase 1 singular", () => {
    const p = buildNotificationPayload(1, 1, 0, 0);
    expect(p.title).toContain("1 taak");
    expect(p.tag).toBe("phase1");
    expect(p.url).toBe("/today");
  });

  it("phase 1 plural", () => {
    const p = buildNotificationPayload(1, 3, 0, 0);
    expect(p.title).toContain("3 taken");
  });

  it("phase 2 uses open count", () => {
    const p = buildNotificationPayload(2, 2, 1, 4);
    expect(p.body).toContain("2 open taken");
    expect(p.tag).toBe("phase2");
  });

  it("phase 3 includes action when instanceId set", () => {
    const p = buildNotificationPayload(3, 2, 2, 6, "inst-1");
    expect(p.instanceId).toBe("inst-1");
    expect(p.actions).toEqual([{ action: "done", title: "✓ Gedaan" }]);
    expect(p.tag).toBe("phase3");
  });

  it("phase 3 omits actions without instanceId", () => {
    const p = buildNotificationPayload(3, 1, 1, 0);
    expect(p.actions).toEqual([]);
    expect(p.instanceId).toBeUndefined();
  });
});
