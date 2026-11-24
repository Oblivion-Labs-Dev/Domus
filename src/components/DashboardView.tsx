"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
import ProgressRing25D from "./ProgressRing25D";
import TiltCard from "./TiltCard";
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
          <div key={i} className="domus-card h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  const canBook = can(currentMember, "booking:create");
  const canApprove = can(currentMember, "booking:approve_others");

  const kpiCards = [
    {
      label: "Overlapping Family Events",
      value: data.overlappingCount,
      sub: `of ${data.stats.totalEvents} total household blocks`,
      icon: <Layers className="h-4 w-4 text-terracotta-600" />,
      podBg: "bg-terracotta-100",
      glow: "rgba(212, 99, 62, 0.16)",
    },
    {
      label: "Pending Time Bookings",
      value: data.stats.pendingBookingsCount,
      sub: "Awaiting acceptance or Head approval",
      icon: <Clock className="h-4 w-4 text-amber-700" />,
      podBg: "bg-amber-100",
      glow: "rgba(217, 119, 6, 0.16)",
    },
    {
      label: "Active Health & Life Plans",
      value: data.stats.activeTrackersCount,
      sub: "Exercise, diet, yoga & driving goals",
      icon: <Activity className="h-4 w-4 text-sage-700" />,
      podBg: "bg-sage-100",
      glow: "rgba(79, 124, 91, 0.18)",
    },
    {
      label: "Open List & Chore Items",
      value: data.stats.openTasksCount,
      sub: "Shopping, meal prep & lawn upkeep",
      icon: <ListChecks className="h-4 w-4 text-stone-800" />,
      podBg: "bg-stone-200/80",
      glow: "rgba(25, 23, 20, 0.1)",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-terracotta-600">
            Home Pulse
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
            Good day, {currentMember.name}
          </h2>
          <p className="text-sm text-stone-500">
            Live view of what overlaps across your home — schedules, bookings,
            wellness, and shared chores.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
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
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-sage-200 bg-sage-50 px-4 py-2.5 text-sm font-medium text-sage-700"
        >
          {actionMessage}
        </motion.div>
      )}

      {/* 2.5D Interactive Tilt KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, type: "spring", stiffness: 280 }}
          >
            <TiltCard maxTilt={7} lift={6} glowColor={kpi.glow} className="p-4">
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold text-stone-500">
                  {kpi.label}
                </span>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl ${kpi.podBg}`}
                  style={{
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.85), 0 2px 0 0 rgba(0,0,0,0.08)",
                  }}
                >
                  {kpi.icon}
                </div>
              </div>
              <p className="mt-2.5 text-3xl font-bold tracking-tight text-stone-900">
                {kpi.value}
              </p>
              <p className="mt-1 text-xs text-stone-500">{kpi.sub}</p>
            </TiltCard>
          </motion.div>
        ))}
      </div>

      {/* Live Availability 2.5D Strip */}
      <div className="domus-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              Who&apos;s Free Right Now
            </h3>
            <p className="text-xs text-stone-500">
              Hover a family tile and click Book Time to reserve an open slot
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {data.memberAvailability.map((m, idx) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.04 }}
              whileHover={{ y: -4 }}
              className="domus-tile flex flex-col justify-between p-3.5"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white"
                  style={{
                    backgroundColor: m.color,
                    boxShadow: `0 3px 0 0 ${m.color}88, 0 8px 14px -4px ${m.color}66`,
                  }}
                >
                  {m.avatarInitials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-stone-900">
                    {m.name}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                      m.status === "AVAILABLE"
                        ? "text-sage-600"
                        : "text-terracotta-600"
                    }`}
                  >
                    <span className="relative flex h-2 w-2">
                      <span
                        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${
                          m.status === "AVAILABLE"
                            ? "bg-sage-400"
                            : "bg-terracotta-400"
                        }`}
                      />
                      <span
                        className={`relative inline-flex h-2 w-2 rounded-full ${
                          m.status === "AVAILABLE"
                            ? "bg-sage-500"
                            : "bg-terracotta-500"
                        }`}
                      />
                    </span>
                    {m.status === "AVAILABLE" ? "Free Now" : "Busy"}
                  </span>
                </div>
              </div>
              <p className="mt-2.5 truncate text-xs text-stone-500">
                {m.currentActivity}
              </p>
              {canBook && m.id !== currentMember.id && (
                <button
                  onClick={() => onNavigate("calendar", m.id)}
                  className="domus-btn-secondary mt-3 w-full py-1.5 text-xs"
                >
                  Book Time
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main 2-column grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Schedule + Booking Inbox */}
        <div className="space-y-6 lg:col-span-7">
          <div className="domus-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900">
                Household Schedule Snapshot
              </h3>
              <button
                onClick={() => onNavigate("calendar")}
                className="text-xs font-semibold text-terracotta-600 transition hover:translate-x-0.5 hover:underline"
              >
                Full Common Calendar →
              </button>
            </div>
            <div className="space-y-2.5">
              {data.todayEvents.map((evt) => {
                const owner = memberById.get(evt.ownerId);
                return (
                  <motion.div
                    key={evt.id}
                    whileHover={{ x: 4, y: -2 }}
                    transition={{ type: "spring", stiffness: 360, damping: 24 }}
                    className={`domus-tile flex items-start justify-between gap-3 border-l-4 p-3.5 ${
                      evt.isFamilyOverlap
                        ? "border-l-terracotta-500"
                        : "border-l-stone-300"
                    }`}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {evt.isRedacted && (
                          <Lock className="h-3.5 w-3.5 text-stone-400" />
                        )}
                        <p className="text-sm font-bold text-stone-900">
                          {evt.title}
                        </p>
                        {evt.isFamilyOverlap && (
                          <span className="rounded-full bg-terracotta-100 px-2 py-0.5 text-[10px] font-bold text-terracotta-700">
                            Shared Overlap
                          </span>
                        )}
                        {evt.hasCollision && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
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
                    <div className="flex shrink-0 -space-x-1.5 transition-all hover:space-x-0.5">
                      {evt.participantIds.map((pid) => {
                        const pm = memberById.get(pid);
                        if (!pm) return null;
                        return (
                          <span
                            key={pid}
                            title={pm.name}
                            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5"
                            style={{ backgroundColor: pm.color }}
                          >
                            {pm.avatarInitials}
                          </span>
                        );
                      })}
                      {evt.participantIds.length === 0 && owner && (
                        <span
                          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow-sm"
                          style={{ backgroundColor: owner.color }}
                        >
                          {owner.avatarInitials}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Time-Booking Inbox */}
          <div className="domus-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-terracotta-500" />
                <h3 className="text-sm font-bold text-stone-900">
                  Time-Booking Requests
                </h3>
              </div>
              <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-500">
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
                    <motion.div
                      key={bk.id}
                      whileHover={{ y: -2 }}
                      className="domus-tile p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-stone-900">
                              {bk.title}
                            </p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
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
                              className="domus-btn-accent px-3 py-1.5 text-xs"
                            >
                              Approve
                            </button>
                          )}
                          {!needsHeadApproval && canRespond && (
                            <button
                              onClick={() => respondBooking(bk.id, "ACCEPT")}
                              className="domus-btn-primary px-3 py-1.5 text-xs"
                            >
                              Accept
                            </button>
                          )}
                          {canRespond && (
                            <button
                              onClick={() => respondBooking(bk.id, "DECLINE")}
                              className="domus-btn-secondary px-3 py-1.5 text-xs"
                            >
                              Decline
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Trackers with 2.5D Rings + Priority Tasks */}
        <div className="space-y-6 lg:col-span-5">
          <div className="domus-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sage-600" />
                <h3 className="text-sm font-bold text-stone-900">
                  Exercise, Diet &amp; Life Plans
                </h3>
              </div>
              <button
                onClick={() => onNavigate("trackers")}
                className="text-xs font-semibold text-sage-600 hover:underline"
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
                    <motion.div
                      key={trk.id}
                      whileHover={{ x: 3 }}
                      onClick={() => onNavigate("trackers")}
                      className="domus-tile flex cursor-pointer items-center gap-3.5 p-3"
                    >
                      <ProgressRing25D
                        percent={pct}
                        color={owner?.color ?? "#4f7c5b"}
                        size={48}
                        strokeWidth={5}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-stone-900">
                          {trk.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-stone-500">
                          {owner?.name} · {trk.currentValue}/{trk.targetValue}{" "}
                          {trk.unit}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="domus-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900">
                Up Next: Shopping, Meal Prep &amp; Chores
              </h3>
              <button
                onClick={() => onNavigate("lists")}
                className="text-xs font-semibold text-stone-600 hover:underline"
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
                  <motion.button
                    key={item.id}
                    whileHover={{ x: 4, y: -1 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => toggleQuickTask(item)}
                    className="domus-tile flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-stone-300 transition-colors hover:text-sage-600" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-stone-800">
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
                        className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm"
                        style={{ backgroundColor: assignee.color }}
                      >
                        {assignee.name}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
