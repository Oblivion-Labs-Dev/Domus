"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  Clock,
  Layers,
  ListChecks,
  Lock,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { can, MemberContext } from "@/lib/rbac";
import {
  ActiveTab,
  CalendarEventDTO,
  formatShortDate,
  formatTimeRange,
  ListItemDTO,
  MemberDTO,
  TimeBookingDTO,
  TrackerDTO,
} from "./types";

interface DashboardData {
  memberAvailability: Array<{
    id: string;
    name: string;
    role: string;
    title: string;
    color: string;
    avatarInitials: string;
    status: "AVAILABLE" | "BUSY";
    currentActivity: string;
  }>;
  todayEvents: CalendarEventDTO[];
  overlappingCount: number;
  pendingBookings: TimeBookingDTO[];
  trackers: TrackerDTO[];
  openItems: ListItemDTO[];
  stats: {
    totalEvents: number;
    pendingBookingsCount: number;
    openTasksCount: number;
    activeTrackersCount: number;
  };
}

interface DashboardViewProps {
  currentMember: MemberContext;
  members: MemberDTO[];
  onNavigate: (tab: ActiveTab, preselectBookMemberId?: string) => void;
}

export default function DashboardView({
  currentMember,
  members,
  onNavigate,
}: DashboardViewProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const memberById = new Map(members.map((m) => [m.id, m]));

  async function loadDashboard() {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [currentMember.id]);

  async function respondBooking(
    bookingId: string,
    action: "ACCEPT" | "DECLINE" | "APPROVE"
  ) {
    setActionMessage(null);
    const res = await fetch(`/api/calendar/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const payload = await res.json();
    if (!res.ok) {
      setActionMessage(payload.error ?? "Action blocked by permissions");
      return;
    }
    setActionMessage(
      action === "ACCEPT"
        ? "Booking accepted and added to the common calendar."
        : action === "APPROVE"
          ? "Junior booking approved!"
          : "Booking declined."
    );
    await loadDashboard();
  }

  async function toggleQuickTask(item: ListItemDTO) {
    await fetch(`/api/lists/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: !item.isCompleted }),
    });
    await loadDashboard();
  }

  if (loading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-stone-200 bg-white"
          />
        ))}
      </div>
    );
  }

  const canBook = can(currentMember, "booking:create");
  const canApprove = can(currentMember, "booking:approve_others");

  return (
    <div className="space-y-6">
      {/* Greeting & KPI strip */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-terracotta-600">
            Home Pulse
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">
            Good day, {currentMember.name}
          </h2>
          <p className="text-sm text-stone-500">
            Here is what overlaps across your home right now — schedules,
            requests, wellness, and chores.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canBook && (
            <button
              onClick={() => onNavigate("calendar")}
              className="domus-btn-accent"
            >
              <CalendarClock className="h-4 w-4" />
              Book Family Time
            </button>
          )}
          <button
            onClick={() => onNavigate("lists")}
            className="domus-btn-secondary"
          >
            <ListChecks className="h-4 w-4" />
            Open Lists
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="rounded-xl border border-sage-200 bg-sage-50 px-4 py-2.5 text-sm text-sage-700">
          {actionMessage}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="domus-card p-4">
          <div className="flex items-center justify-between text-xs font-medium text-stone-500">
            <span>Overlapping Family Events</span>
            <Layers className="h-4 w-4 text-terracotta-500" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-stone-900">
            {data.overlappingCount}
          </p>
          <p className="mt-0.5 text-xs text-stone-500">
            of {data.stats.totalEvents} total household blocks
          </p>
        </div>

        <div className="domus-card p-4">
          <div className="flex items-center justify-between text-xs font-medium text-stone-500">
            <span>Pending Time Bookings</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-stone-900">
            {data.stats.pendingBookingsCount}
          </p>
          <p className="mt-0.5 text-xs text-stone-500">
            Awaiting acceptance or Head approval
          </p>
        </div>

        <div className="domus-card p-4">
          <div className="flex items-center justify-between text-xs font-medium text-stone-500">
            <span>Active Health &amp; Life Plans</span>
            <Activity className="h-4 w-4 text-sage-600" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-stone-900">
            {data.stats.activeTrackersCount}
          </p>
          <p className="mt-0.5 text-xs text-stone-500">
            Exercise, diet, yoga &amp; driving goals
          </p>
        </div>

        <div className="domus-card p-4">
          <div className="flex items-center justify-between text-xs font-medium text-stone-500">
            <span>Open List &amp; Chore Items</span>
            <ListChecks className="h-4 w-4 text-stone-700" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-stone-900">
            {data.stats.openTasksCount}
          </p>
          <p className="mt-0.5 text-xs text-stone-500">
            Shopping, meal prep &amp; lawn upkeep
          </p>
        </div>
      </div>

      {/* Live Availability Strip */}
      <div className="domus-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-stone-900">
              Who&apos;s Free Right Now
            </h3>
            <p className="text-xs text-stone-500">
              Live household availability — click Book to request someone&apos;s
              open time
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {data.memberAvailability.map((m) => (
            <div
              key={m.id}
              className="flex flex-col justify-between rounded-xl border border-stone-200 bg-stone-50/70 p-3"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: m.color }}
                >
                  {m.avatarInitials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-stone-900">
                    {m.name}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                      m.status === "AVAILABLE"
                        ? "text-sage-600"
                        : "text-terracotta-600"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        m.status === "AVAILABLE"
                          ? "bg-sage-500"
                          : "bg-terracotta-500"
                      }`}
                    />
                    {m.status === "AVAILABLE" ? "Free" : "Busy"}
                  </span>
                </div>
              </div>
              <p className="mt-2 truncate text-xs text-stone-500">
                {m.currentActivity}
              </p>
              {canBook && m.id !== currentMember.id && (
                <button
                  onClick={() => onNavigate("calendar", m.id)}
                  className="mt-3 w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 transition hover:border-stone-400 hover:text-stone-900"
                >
                  Book Time
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main 2-column grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Schedule + Booking Inbox */}
        <div className="space-y-6 lg:col-span-7">
          <div className="domus-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-stone-900">
                Household Schedule Snapshot
              </h3>
              <button
                onClick={() => onNavigate("calendar")}
                className="text-xs font-medium text-terracotta-600 hover:underline"
              >
                Full Common Calendar →
              </button>
            </div>
            <div className="space-y-2.5">
              {data.todayEvents.map((evt) => {
                const owner = memberById.get(evt.ownerId);
                return (
                  <div
                    key={evt.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-stone-200/80 bg-stone-50/50 p-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {evt.isRedacted && (
                          <Lock className="h-3.5 w-3.5 text-stone-400" />
                        )}
                        <p className="text-sm font-semibold text-stone-900">
                          {evt.title}
                        </p>
                        {evt.isFamilyOverlap && (
                          <span className="rounded-full bg-terracotta-100 px-2 py-0.5 text-[10px] font-semibold text-terracotta-700">
                            Shared Overlap
                          </span>
                        )}
                        {evt.hasCollision && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                            Conflict
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500">
                        {formatShortDate(evt.startTime)} ·{" "}
                        {formatTimeRange(evt.startTime, evt.endTime)}
                        {evt.location ? ` · ${evt.location}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 -space-x-1.5">
                      {evt.participantIds.map((pid) => {
                        const pm = memberById.get(pid);
                        if (!pm) return null;
                        return (
                          <span
                            key={pid}
                            title={pm.name}
                            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold text-white"
                            style={{ backgroundColor: pm.color }}
                          >
                            {pm.avatarInitials}
                          </span>
                        );
                      })}
                      {evt.participantIds.length === 0 && owner && (
                        <span
                          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold text-white"
                          style={{ backgroundColor: owner.color }}
                        >
                          {owner.avatarInitials}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time-Booking Inbox */}
          <div className="domus-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-terracotta-500" />
                <h3 className="text-sm font-semibold text-stone-900">
                  Time-Booking Requests
                </h3>
              </div>
              <span className="text-xs text-stone-400">
                {data.pendingBookings.length} active
              </span>
            </div>

            {data.pendingBookings.length === 0 ? (
              <p className="rounded-xl bg-stone-50 p-4 text-center text-xs text-stone-500">
                All caught up — no pending time-booking requests.
              </p>
            ) : (
              <div className="space-y-3">
                {data.pendingBookings.map((bk) => {
                  const req = memberById.get(bk.requesterId);
                  const tgt = memberById.get(bk.targetMemberId);
                  const canRespond =
                    bk.targetMemberId === currentMember.id || canApprove;
                  const needsHeadApproval =
                    bk.status === "AWAITING_HEAD_APPROVAL";

                  return (
                    <div
                      key={bk.id}
                      className="rounded-xl border border-stone-200 bg-stone-50/70 p-3.5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-stone-900">
                              {bk.title}
                            </p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                needsHeadApproval
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-stone-200 text-stone-700"
                              }`}
                            >
                              {needsHeadApproval
                                ? "Needs Head Approval"
                                : "Pending"}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-stone-600">
                            <strong>{req?.name ?? "Member"}</strong> wants to
                            book <strong>{tgt?.name ?? "Member"}</strong> ·{" "}
                            {formatShortDate(bk.startTime)}{" "}
                            {formatTimeRange(bk.startTime, bk.endTime)}
                          </p>
                          {bk.notes && (
                            <p className="mt-1 text-xs text-stone-500">
                              “{bk.notes}”
                            </p>
                          )}
                        </div>

                        <div className="flex gap-1.5">
                          {needsHeadApproval && canApprove && (
                            <button
                              onClick={() => respondBooking(bk.id, "APPROVE")}
                              className="rounded-lg bg-sage-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-sage-700"
                            >
                              Approve
                            </button>
                          )}
                          {!needsHeadApproval && canRespond && (
                            <button
                              onClick={() => respondBooking(bk.id, "ACCEPT")}
                              className="rounded-lg bg-stone-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-stone-800"
                            >
                              Accept
                            </button>
                          )}
                          {canRespond && (
                            <button
                              onClick={() => respondBooking(bk.id, "DECLINE")}
                              className="rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100"
                            >
                              Decline
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Trackers + Priority Tasks */}
        <div className="space-y-6 lg:col-span-5">
          <div className="domus-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sage-600" />
                <h3 className="text-sm font-semibold text-stone-900">
                  Exercise, Diet &amp; Life Plans
                </h3>
              </div>
              <button
                onClick={() => onNavigate("trackers")}
                className="text-xs font-medium text-sage-600 hover:underline"
              >
                Log progress →
              </button>
            </div>

            {data.trackers.length === 0 ? (
              <p className="rounded-xl bg-stone-50 p-4 text-xs text-stone-500">
                Health and personal plan trackers are hidden for your role.
              </p>
            ) : (
              <div className="space-y-3">
                {data.trackers.slice(0, 4).map((trk) => {
                  const pct = Math.min(
                    100,
                    Math.round((trk.currentValue / trk.targetValue) * 100)
                  );
                  const owner = memberById.get(trk.memberId);
                  return (
                    <div key={trk.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-stone-800">
                          {trk.title}
                        </span>
                        <span className="text-stone-500">
                          {trk.currentValue}/{trk.targetValue} {trk.unit}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: owner?.color ?? "#4f7c5b",
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-stone-400">
                        <span>
                          {owner?.name} · {trk.category}
                        </span>
                        <span>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="domus-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-stone-900">
                Up Next: Shopping, Meal Prep &amp; Chores
              </h3>
              <button
                onClick={() => onNavigate("lists")}
                className="text-xs font-medium text-stone-600 hover:underline"
              >
                View all →
              </button>
            </div>
            <div className="space-y-2">
              {data.openItems.map((item) => {
                const assignee = item.assigneeId
                  ? memberById.get(item.assigneeId)
                  : null;
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleQuickTask(item)}
                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-stone-200/70 bg-stone-50/60 px-3 py-2 text-left transition hover:bg-white"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-stone-300" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-stone-800">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-stone-400">
                          {item.category}
                          {item.quantity ? ` · ${item.quantity}` : ""}
                        </p>
                      </div>
                    </div>
                    {assignee && (
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                        style={{ backgroundColor: assignee.color }}
                      >
                        {assignee.name}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
