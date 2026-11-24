import { describe, expect, it } from "vitest";
import {
  can,
  canEditOrDeleteEvent,
  canViewTracker,
  MemberContext,
  redactEventForViewer,
  requiresHeadApprovalForBooking,
} from "../src/lib/rbac";

const makeMember = (
  id: string,
  role: MemberContext["role"],
  permissions: MemberContext["permissions"] = {}
): MemberContext => ({
  id,
  householdId: "hh_test",
  name: id,
  email: `${id}@domus.local`,
  role,
  title: role,
  color: "#4f7c5b",
  avatarInitials: "TM",
  permissions,
});

describe("Domus RBAC engine", () => {
  const head = makeMember("head", "HEAD");
  const coHead = makeMember("cohead", "CO_HEAD");
  const member = makeMember("member", "MEMBER");
  const junior = makeMember("junior", "JUNIOR");
  const guest = makeMember("guest", "GUEST");

  it("enforces Head of Household exclusive governance", () => {
    expect(can(head, "family:manage_roles")).toBe(true);
    expect(can(coHead, "family:manage_roles")).toBe(false);
    expect(can(member, "family:manage_roles")).toBe(false);
    expect(can(junior, "family:manage_roles")).toBe(false);
    expect(can(guest, "family:manage_roles")).toBe(false);
  });

  it("requires approval for Junior time-bookings unless overridden", () => {
    expect(requiresHeadApprovalForBooking(junior)).toBe(true);
    expect(requiresHeadApprovalForBooking(member)).toBe(false);

    const trustedJunior = makeMember("junior2", "JUNIOR", {
      canBookWithoutApproval: true,
    });
    expect(requiresHeadApprovalForBooking(trustedJunior)).toBe(false);
  });

  it("redacts PRIVATE calendar blocks as Busy for household members and hides them from Guests", () => {
    const privateEvent = {
      id: "evt_1",
      householdId: "hh_test",
      title: "Private Doctor Visit",
      category: "PERSONAL",
      ownerId: "head",
      participantIdsJson: JSON.stringify(["head"]),
      startTime: "2026-11-24T10:00:00.000Z",
      endTime: "2026-11-24T11:00:00.000Z",
      visibility: "PRIVATE",
      isShared: false,
      location: "Clinic",
      notes: "Confidential",
      createdAt: "2026-11-24T00:00:00.000Z",
    };

    const forOwner = redactEventForViewer(privateEvent, head);
    expect(forOwner?.isRedacted).toBe(false);
    expect(forOwner?.title).toBe("Private Doctor Visit");

    const forMember = redactEventForViewer(privateEvent, member);
    expect(forMember?.isRedacted).toBe(true);
    expect(forMember?.title).toBe("Busy (Private Block)");
    expect(forMember?.notes).toBe("");

    const forGuest = redactEventForViewer(privateEvent, guest);
    expect(forGuest).toBeNull();
  });

  it("blocks Guests from health trackers unless explicitly granted override", () => {
    const sharedTracker = { memberId: "cohead", visibility: "FAMILY" };
    expect(canViewTracker(sharedTracker, member)).toBe(true);
    expect(canViewTracker(sharedTracker, guest)).toBe(false);

    const caregiverGuest = makeMember("guest_caregiver", "GUEST", {
      canViewAllHealth: true,
    });
    expect(canViewTracker(sharedTracker, caregiverGuest)).toBe(true);
  });

  it("restricts deleting other members' events to Head and Co-Head", () => {
    const memberEvent = { ownerId: "member" };
    expect(canEditOrDeleteEvent(memberEvent, member)).toBe(true);
    expect(canEditOrDeleteEvent(memberEvent, head)).toBe(true);
    expect(canEditOrDeleteEvent(memberEvent, coHead)).toBe(true);
    expect(canEditOrDeleteEvent(memberEvent, junior)).toBe(false);
    expect(canEditOrDeleteEvent(memberEvent, guest)).toBe(false);
  });
});
