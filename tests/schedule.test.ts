import { describe, expect, it } from "vitest";
import {
  annotateScheduleOverlaps,
  findAvailableSlots,
  findConflictsForMember,
  findConflictsForResource,
  intervalsOverlap,
  ScheduleBlock,
} from "../src/lib/schedule";

describe("Domus Overlap & Time-Booking Engine", () => {
  const sampleBlocks: ScheduleBlock[] = [
    {
      id: "evt_yoga",
      title: "Morning Yoga",
      ownerId: "mom",
      participantIds: ["mom", "dad"],
      startTime: new Date(2026, 10, 24, 8, 0).toISOString(),
      endTime: new Date(2026, 10, 24, 9, 0).toISOString(),
      isShared: true,
    },
    {
      id: "evt_private",
      title: "Busy (Private Block)",
      ownerId: "dad",
      participantIds: ["dad"],
      startTime: new Date(2026, 10, 24, 13, 0).toISOString(),
      endTime: new Date(2026, 10, 24, 14, 0).toISOString(),
      isShared: false,
      isRedacted: true,
    },
    {
      id: "evt_collision",
      title: "Driving Lesson",
      ownerId: "son",
      participantIds: ["son", "dad"],
      startTime: new Date(2026, 10, 24, 13, 30).toISOString(),
      endTime: new Date(2026, 10, 24, 14, 30).toISOString(),
      isShared: true,
    },
  ];

  it("correctly evaluates interval overlaps without false positives on adjacent edges", () => {
    expect(
      intervalsOverlap(
        "2026-11-24T10:00:00.000Z",
        "2026-11-24T11:00:00.000Z",
        "2026-11-24T11:00:00.000Z",
        "2026-11-24T12:00:00.000Z"
      )
    ).toBe(false);

    expect(
      intervalsOverlap(
        "2026-11-24T10:00:00.000Z",
        "2026-11-24T11:00:00.000Z",
        "2026-11-24T10:30:00.000Z",
        "2026-11-24T11:30:00.000Z"
      )
    ).toBe(true);
  });

  it("detects conflicts against private redacted blocks without exposing details", () => {
    const conflicts = findConflictsForMember(
      sampleBlocks,
      "dad",
      new Date(2026, 10, 24, 13, 15).toISOString(),
      new Date(2026, 10, 24, 13, 45).toISOString()
    );

    expect(conflicts.length).toBeGreaterThanOrEqual(1);
    expect(conflicts.some((c) => c.title === "Busy (Private Block)")).toBe(true);
  });

  it("finds open booking slots excluding occupied hours", () => {
    const slots = findAvailableSlots({
      blocks: sampleBlocks,
      targetMemberId: "dad",
      dateStr: "2026-11-24",
      durationMinutes: 60,
      dayStartHour: 8,
      dayEndHour: 16,
    });

    const labels = slots.map((s) => s.label);
    expect(labels).not.toContain("8:00 AM – 9:00 AM"); // Yoga
    expect(labels).not.toContain("1:00 PM – 2:00 PM"); // Private block
    expect(labels).not.toContain("2:00 PM – 3:00 PM"); // Driving lesson ends 2:30
    expect(labels).toContain("9:00 AM – 10:00 AM");
    expect(labels).toContain("10:00 AM – 11:00 AM");
  });

  it("annotates shared family overlaps and participant collisions", () => {
    const annotated = annotateScheduleOverlaps(sampleBlocks);
    const yoga = annotated.find((e) => e.id === "evt_yoga");
    const priv = annotated.find((e) => e.id === "evt_private");
    const driving = annotated.find((e) => e.id === "evt_collision");

    expect(yoga?.isFamilyOverlap).toBe(true);
    expect(yoga?.hasCollision).toBe(false);
    expect(priv?.isFamilyOverlap).toBe(false);
    expect(priv?.hasCollision).toBe(true);
    expect(driving?.hasCollision).toBe(true);
  });

  it("prevents double-booking shared House Gear resources (e.g., Lawn Mower)", () => {
    const gearBlocks: ScheduleBlock[] = [
      {
        id: "evt_mow",
        title: "Lawn Mowing",
        ownerId: "dad",
        participantIds: ["dad"],
        resourceId: "res_mower",
        startTime: "2026-11-28T09:00:00.000Z",
        endTime: "2026-11-28T10:30:00.000Z",
        isShared: true,
      },
    ];

    const conflicts = findConflictsForResource(
      gearBlocks,
      "res_mower",
      "2026-11-28T09:30:00.000Z",
      "2026-11-28T11:00:00.000Z"
    );
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].reason).toBe("RESOURCE");

    const noConflict = findConflictsForResource(
      gearBlocks,
      "res_mower",
      "2026-11-28T10:30:00.000Z",
      "2026-11-28T11:30:00.000Z"
    );
    expect(noConflict.length).toBe(0);
  });
});
