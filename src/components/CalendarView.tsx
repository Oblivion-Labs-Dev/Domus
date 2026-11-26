"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  Lock,
  Trash2,
  UserCheck,
  Wrench,
} from "lucide-react";
import { can, canEditOrDeleteEvent, MemberContext } from "@/lib/rbac";
import {
  CalendarEventDTO,
  formatShortDate,
  formatTimeRange,
  HouseResourceDTO,
  MemberDTO,
  TimeBookingDTO,
} from "./types";

interface AvailableSlot {
  startTime: string;
  endTime: string;
  label: string;
}

interface CalendarViewProps {
  currentMember: MemberContext;
  members: MemberDTO[];
  initialBookMemberId?: string;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM to 9 PM
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CalendarView({
  currentMember,
  members,
  initialBookMemberId,
}: CalendarViewProps) {
  const [events, setEvents] = useState<CalendarEventDTO[]>([]);
  const [bookings, setBookings] = useState<TimeBookingDTO[]>([]);
  const [resources, setResources] = useState<HouseResourceDTO[]>([]);
  const [viewMode, setViewMode] = useState<"DAILY" | "WEEKLY" | "YEARLY">(
    "WEEKLY"
  );
  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());
  const [memberFilter, setMemberFilter] = useState<string>("ALL");
  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  // Add event form
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [evtTitle, setEvtTitle] = useState("");
  const [evtCategory, setEvtCategory] = useState("FAMILY");
  const [evtDate, setEvtDate] = useState(() => toDateKey(new Date()));
  const [evtStart, setEvtStart] = useState("10:00");
  const [evtEnd, setEvtEnd] = useState("11:00");
  const [evtVisibility, setEvtVisibility] = useState<
    "FAMILY" | "ADULTS_ONLY" | "PRIVATE"
  >("FAMILY");
  const [evtShared, setEvtShared] = useState(true);
  const [evtParticipants, setEvtParticipants] = useState<string[]>([]);
  const [evtResourceId, setEvtResourceId] = useState("");
  const [evtLocation, setEvtLocation] = useState("");

  // Book someone's time state
  const defaultTarget =
    initialBookMemberId && initialBookMemberId !== currentMember.id
      ? initialBookMemberId
      : members.find((m) => m.id !== currentMember.id)?.id ?? "";
  const [bookTargetId, setBookTargetId] = useState(defaultTarget);
  const [bookDate, setBookDate] = useState(() => toDateKey(new Date()));
  const [bookDuration, setBookDuration] = useState(60);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [bookTitle, setBookTitle] = useState("");
  const [bookNotes, setBookNotes] = useState("");
  const [bookCategory, setBookCategory] = useState("DRIVING");

  const memberById = new Map(members.map((m) => [m.id, m]));
  const resourceById = new Map(resources.map((r) => [r.id, r]));

  async function loadAll() {
    const [evRes, bkRes, resRes] = await Promise.all([
      fetch("/api/calendar/events"),
      fetch("/api/calendar/bookings"),
      fetch("/api/resources"),
    ]);
    if (evRes.ok) {
      const d = await evRes.json();
      setEvents(d.events ?? []);
    }
    if (bkRes.ok) {
      const d = await bkRes.json();
      setBookings(d.bookings ?? []);
    }
    if (resRes.ok) {
      const d = await resRes.json();
      setResources(d.resources ?? []);
    }
  }

  useEffect(() => {
    loadAll();
  }, [currentMember.id]);

  useEffect(() => {
    if (!bookTargetId || !bookDate) return;
    fetch(
      `/api/calendar/availability?memberId=${encodeURIComponent(bookTargetId)}&date=${encodeURIComponent(bookDate)}&duration=${bookDuration}`
    )
      .then((r) => (r.ok ? r.json() : { slots: [] }))
      .then((d) => {
        setSlots(d.slots ?? []);
        setSelectedSlot((d.slots ?? [])[0] ?? null);
      });
  }, [bookTargetId, bookDate, bookDuration, events.length]);

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (
        memberFilter !== "ALL" &&
        evt.ownerId !== memberFilter &&
        !evt.participantIds.includes(memberFilter)
      ) {
        return false;
      }
      return true;
    });
  }, [events, memberFilter]);

  // Compute 7 days of current week starting Sunday
  const weekDays = useMemo(() => {
    const start = new Date(anchorDate);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [anchorDate]);

  const eventsByDayKey = useMemo(() => {
    const map = new Map<string, CalendarEventDTO[]>();
    for (const evt of filteredEvents) {
      const key = toDateKey(new Date(evt.startTime));
      const list = map.get(key) ?? [];
      list.push(evt);
      map.set(key, list);
    }
    return map;
  }, [filteredEvents]);

  function stepDate(delta: number) {
    const next = new Date(anchorDate);
    if (viewMode === "DAILY") next.setDate(next.getDate() + delta);
    else if (viewMode === "WEEKLY") next.setDate(next.getDate() + delta * 7);
    else next.setFullYear(next.getFullYear() + delta);
    setAnchorDate(next);
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const startTime = new Date(`${evtDate}T${evtStart}:00`).toISOString();
    const endTime = new Date(`${evtDate}T${evtEnd}:00`).toISOString();

    const res = await fetch("/api/calendar/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: evtTitle,
        category: evtCategory,
        participantIds: evtShared ? evtParticipants : [],
        resourceId: evtResourceId || null,
        startTime,
        endTime,
        visibility: evtVisibility,
        isShared: evtShared,
        location: evtLocation,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedback({ type: "err", text: data.error ?? "Could not create event" });
      return;
    }
    setEvtTitle("");
    setEvtLocation("");
    setEvtResourceId("");
    setShowAddEvent(false);
    setFeedback({ type: "ok", text: "Scheduled on the Domus Calendar!" });
    await loadAll();
  }

  async function handleDeleteEvent(id: string) {
    const res = await fetch(`/api/calendar/events/${id}`, { method: "DELETE" });
    if (res.ok) await loadAll();
  }

  async function handleBookTime(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot) return;
    setFeedback(null);
    const res = await fetch("/api/calendar/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetMemberId: bookTargetId,
        title: bookTitle,
        category: bookCategory,
        notes: bookNotes,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedback({ type: "err", text: data.error ?? "Booking failed" });
      return;
    }
    setBookTitle("");
    setBookNotes("");
    setFeedback({
      type: "ok",
      text:
        data.status === "AWAITING_HEAD_APPROVAL"
          ? "Booking sent to Head/Co-Head for Junior approval!"
          : "Time-booking request sent!",
    });
    await loadAll();
  }

  async function handleBookingAction(
    id: string,
    action: "ACCEPT" | "DECLINE" | "APPROVE" | "CANCEL"
  ) {
    const res = await fetch(`/api/calendar/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) await loadAll();
  }

  const canCreate = can(currentMember, "calendar:create_personal");
  const canCreateShared = can(currentMember, "calendar:create_shared");
  const canBook = can(currentMember, "booking:create");
  const canApprove = can(currentMember, "booking:approve_others");

  const anchorKey = toDateKey(anchorDate);
  const dailyEvents = eventsByDayKey.get(anchorKey) ?? [];

  return (
    <div className="space-y-6">
      {/* Header with 2.5D Calendar Asset */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/calendar-3d.png"
            alt="Calendar"
            className="hidden h-16 w-16 shrink-0 rounded-2xl border-2 border-white bg-[#faf9f5] object-cover shadow-md sm:block"
          />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-terracotta-600">
              Daily · Weekly · Yearly
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              Household &amp; Personal Calendar
            </h2>
            <p className="text-sm text-stone-500">
              Board tasks with dates auto-sync here alongside family overlaps,
              House Gear reservations &amp; time-booking.
            </p>
          </div>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowAddEvent((v) => !v)}
            className="domus-btn-primary whitespace-nowrap"
          >
            <CalendarPlus className="h-4 w-4" />
            {showAddEvent ? "Close Form" : "Add Event"}
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${
            feedback.type === "ok"
              ? "border-sage-200 bg-sage-50 text-sage-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Add Event Drawer */}
      <AnimatePresence>
        {showAddEvent && canCreate && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleCreateEvent}
            className="domus-card space-y-4 p-5"
          >
            <h3 className="text-sm font-bold text-stone-900">
              Schedule Event or Reserve House Gear
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-stone-600">
                  Title
                </label>
                <input
                  required
                  value={evtTitle}
                  onChange={(e) => setEvtTitle(e.target.value)}
                  placeholder="e.g., Driving Lesson, Yoga, Lawn Mowing"
                  className="domus-input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">
                  Reserve House Gear
                </label>
                <select
                  value={evtResourceId}
                  onChange={(e) => setEvtResourceId(e.target.value)}
                  className="domus-input"
                >
                  <option value="">None</option>
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">
                  Visibility
                </label>
                <select
                  value={evtVisibility}
                  onChange={(e) =>
                    setEvtVisibility(
                      e.target.value as "FAMILY" | "ADULTS_ONLY" | "PRIVATE"
                    )
                  }
                  className="domus-input"
                >
                  <option value="FAMILY">Family Shared</option>
                  <option value="ADULTS_ONLY">Adults Only</option>
                  <option value="PRIVATE">Private (Shows as Busy)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={evtDate}
                  onChange={(e) => setEvtDate(e.target.value)}
                  className="domus-input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">
                  Start
                </label>
                <input
                  type="time"
                  required
                  value={evtStart}
                  onChange={(e) => setEvtStart(e.target.value)}
                  className="domus-input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">
                  End
                </label>
                <input
                  type="time"
                  required
                  value={evtEnd}
                  onChange={(e) => setEvtEnd(e.target.value)}
                  className="domus-input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">
                  Category
                </label>
                <select
                  value={evtCategory}
                  onChange={(e) => setEvtCategory(e.target.value)}
                  className="domus-input"
                >
                  <option value="FAMILY">Family</option>
                  <option value="DRIVING">Driving</option>
                  <option value="YOGA">Yoga</option>
                  <option value="EXERCISE">Exercise</option>
                  <option value="DIET">Diet / Meal Prep</option>
                  <option value="SHOPPING">Shopping</option>
                  <option value="CHORE">Chore / Lawn</option>
                  <option value="PERSONAL">Personal</option>
                </select>
              </div>
            </div>

            {canCreateShared && (
              <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-stone-700">
                  <input
                    type="checkbox"
                    checked={evtShared}
                    onChange={(e) => setEvtShared(e.target.checked)}
                    className="rounded border-stone-300"
                  />
                  Invite Family:
                </label>
                {evtShared &&
                  members
                    .filter((m) => m.id !== currentMember.id)
                    .map((m) => {
                      const active = evtParticipants.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() =>
                            setEvtParticipants((prev) =>
                              active
                                ? prev.filter((id) => id !== m.id)
                                : [...prev, m.id]
                            )
                          }
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            active
                              ? "bg-stone-900 text-white"
                              : "bg-stone-100 text-stone-600"
                          }`}
                        >
                          {m.name}
                        </button>
                      );
                    })}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddEvent(false)}
                className="domus-btn-secondary text-xs"
              >
                Cancel
              </button>
              <button type="submit" className="domus-btn-primary text-xs">
                Save Event
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Toolbar: Daily / Weekly / Yearly + Date Nav + Member Filter */}
      <div className="domus-card flex flex-wrap items-center justify-between gap-3 p-3.5">
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-stone-100 p-1 text-xs font-bold">
            {(["DAILY", "WEEKLY", "YEARLY"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`relative whitespace-nowrap rounded-lg px-3 py-1.5 transition-colors ${
                  viewMode === mode
                    ? "text-white"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {viewMode === mode && (
                  <motion.span
                    layoutId="cal-view-mode"
                    transition={{ type: "spring", stiffness: 420, damping: 30 }}
                    className="absolute inset-0 rounded-lg bg-stone-900"
                  />
                )}
                <span className="relative z-10">
                  {mode === "DAILY"
                    ? "Daily"
                    : mode === "WEEKLY"
                      ? "Weekly"
                      : "Yearly"}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => stepDate(-1)}
              className="rounded-lg border border-stone-200 bg-white p-1.5 text-stone-600 hover:bg-stone-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setAnchorDate(new Date())}
              className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-bold text-stone-700 hover:bg-stone-100"
            >
              Today
            </button>
            <button
              onClick={() => stepDate(1)}
              className="rounded-lg border border-stone-200 bg-white p-1.5 text-stone-600 hover:bg-stone-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <span className="ml-1 text-sm font-bold text-stone-900">
            {viewMode === "YEARLY"
              ? anchorDate.getFullYear()
              : viewMode === "DAILY"
                ? anchorDate.toLocaleDateString([], {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })
                : `${weekDays[0].toLocaleDateString([], { month: "short", day: "numeric" })} – ${weekDays[6].toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}`}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setMemberFilter("ALL")}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              memberFilter === "ALL"
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-600"
            }`}
          >
            Everyone
          </button>
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => setMemberFilter(m.id)}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                memberFilter === m.id
                  ? "text-white"
                  : "bg-stone-100 text-stone-600"
              }`}
              style={
                memberFilter === m.id ? { backgroundColor: m.color } : undefined
              }
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main Calendar Surface (8 cols) */}
        <div className="lg:col-span-8">
          {/* WEEKLY VIEW (Google / Notion Style 7-Day Grid) */}
          {viewMode === "WEEKLY" && (
            <div className="domus-card overflow-hidden">
              <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50/90">
                {weekDays.map((d) => {
                  const key = toDateKey(d);
                  const isToday = key === toDateKey(new Date());
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setAnchorDate(d);
                        setViewMode("DAILY");
                      }}
                      className={`border-r border-stone-200/70 px-2 py-3 text-center transition last:border-r-0 hover:bg-white ${
                        isToday ? "bg-terracotta-50/70" : ""
                      }`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        {d.toLocaleDateString([], { weekday: "short" })}
                      </p>
                      <p
                        className={`mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          isToday
                            ? "bg-terracotta-500 text-white shadow-sm"
                            : "text-stone-800"
                        }`}
                      >
                        {d.getDate()}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="grid min-h-[420px] grid-cols-7 divide-x divide-stone-100 bg-white">
                {weekDays.map((d) => {
                  const key = toDateKey(d);
                  const dayEvts = eventsByDayKey.get(key) ?? [];
                  return (
                    <div key={key} className="space-y-2 p-2">
                      {dayEvts.length === 0 ? (
                        <p className="pt-8 text-center text-[10px] text-stone-300">
                          Open
                        </p>
                      ) : (
                        dayEvts.map((evt) => {
                          const owner = memberById.get(evt.ownerId);
                          const gear = evt.resourceId
                            ? resourceById.get(evt.resourceId)
                            : null;
                          return (
                            <motion.div
                              key={evt.id}
                              whileHover={{ y: -2, scale: 1.02 }}
                              className="rounded-xl border border-stone-200/90 bg-stone-50/90 p-2 text-left shadow-sm"
                              style={{
                                borderLeftWidth: 3,
                                borderLeftColor: evt.isFamilyOverlap
                                  ? "#d4633e"
                                  : owner?.color ?? "#787164",
                              }}
                            >
                              <p className="line-clamp-2 text-[11px] font-bold leading-tight text-stone-900">
                                {evt.isRedacted && (
                                  <Lock className="mr-1 inline h-2.5 w-2.5 text-stone-400" />
                                )}
                                {evt.title}
                              </p>
                              <p className="mt-1 text-[10px] text-stone-500">
                                {new Date(evt.startTime).toLocaleTimeString(
                                  [],
                                  { hour: "numeric", minute: "2-digit" }
                                )}
                              </p>
                              {gear && (
                                <p className="mt-1 truncate text-[9px] font-bold text-terracotta-600">
                                  🔧 {gear.name}
                                </p>
                              )}
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DAILY VIEW (Hourly Timeline) */}
          {viewMode === "DAILY" && (
            <div className="domus-card divide-y divide-stone-100 overflow-hidden">
              {HOURS.map((hour) => {
                const slotEvts = dailyEvents.filter(
                  (e) => new Date(e.startTime).getHours() === hour
                );
                const label =
                  hour === 12
                    ? "12 PM"
                    : hour > 12
                      ? `${hour - 12} PM`
                      : `${hour} AM`;
                return (
                  <div
                    key={hour}
                    className="grid min-h-[54px] grid-cols-12 items-start bg-white px-4 py-2"
                  >
                    <span className="col-span-2 pt-1 text-[11px] font-bold text-stone-400">
                      {label}
                    </span>
                    <div className="col-span-10 space-y-2">
                      {slotEvts.map((evt) => {
                        const gear = evt.resourceId
                          ? resourceById.get(evt.resourceId)
                          : null;
                        const removable = canEditOrDeleteEvent(
                          evt,
                          currentMember
                        );
                        return (
                          <div
                            key={evt.id}
                            className={`domus-tile flex items-start justify-between gap-3 border-l-4 p-3 ${
                              evt.isFamilyOverlap
                                ? "border-l-terracotta-500"
                                : "border-l-stone-400"
                            }`}
                          >
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="text-xs font-bold text-stone-900">
                                  {evt.title}
                                </p>
                                {evt.isFamilyOverlap && (
                                  <span className="inline-flex items-center gap-0.5 rounded-full bg-terracotta-100 px-2 py-0.5 text-[10px] font-bold text-terracotta-700">
                                    <Layers className="h-2.5 w-2.5" />
                                    Overlap
                                  </span>
                                )}
                                {gear && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-700">
                                    <Wrench className="h-2.5 w-2.5 text-terracotta-500" />
                                    {gear.name}
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-[11px] text-stone-500">
                                <Clock className="mr-1 inline h-3 w-3" />
                                {formatTimeRange(evt.startTime, evt.endTime)}
                                {evt.location ? ` · ${evt.location}` : ""}
                              </p>
                            </div>
                            {removable && !evt.isRedacted && (
                              <button
                                onClick={() => handleDeleteEvent(evt.id)}
                                className="rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* YEARLY VIEW (Full 12-Month Heatmap Grid) */}
          {viewMode === "YEARLY" && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {MONTHS.map((monthName, monthIdx) => {
                const year = anchorDate.getFullYear();
                const firstDay = new Date(year, monthIdx, 1).getDay();
                const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
                const cells = Array.from({ length: firstDay + daysInMonth });
                return (
                  <div key={monthName} className="domus-card p-3.5">
                    <h4 className="mb-2 text-xs font-bold text-stone-900">
                      {monthName} {year}
                    </h4>
                    <div className="mb-1 grid grid-cols-7 text-center text-[9px] font-bold text-stone-400">
                      {["S", "M", "T", "W", "T", "F", "S"].map((w, wi) => (
                        <span key={wi}>{w}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">
                      {cells.map((_, ci) => {
                        const dayNum = ci - firstDay + 1;
                        if (dayNum < 1) return <span key={ci} />;
                        const cellDate = new Date(year, monthIdx, dayNum);
                        const key = toDateKey(cellDate);
                        const count = (eventsByDayKey.get(key) ?? []).length;
                        const isToday = key === toDateKey(new Date());
                        return (
                          <button
                            key={ci}
                            onClick={() => {
                              setAnchorDate(cellDate);
                              setViewMode("DAILY");
                            }}
                            title={
                              count > 0
                                ? `${count} plan(s) on ${monthName} ${dayNum}`
                                : `${monthName} ${dayNum}`
                            }
                            className={`flex h-6 w-6 flex-col items-center justify-center rounded-md text-[10px] font-semibold transition hover:scale-110 ${
                              isToday
                                ? "bg-stone-900 text-white"
                                : count >= 2
                                  ? "bg-terracotta-500 text-white"
                                  : count === 1
                                    ? "bg-sage-200 text-sage-800"
                                    : "text-stone-600 hover:bg-stone-100"
                            }`}
                          >
                            {dayNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 4 cols: Book Someone's Time + Queue */}
        <div className="space-y-5 lg:col-span-4">
          <div className="domus-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-terracotta-500" />
              <h3 className="text-sm font-bold text-stone-900">
                Book Someone&apos;s Time
              </h3>
            </div>

            {!canBook ? (
              <p className="rounded-xl bg-stone-50 p-3 text-xs text-stone-500">
                Guests cannot book family members&apos; time.
              </p>
            ) : (
              <form onSubmit={handleBookTime} className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <select
                    value={bookTargetId}
                    onChange={(e) => setBookTargetId(e.target.value)}
                    className="domus-input text-xs"
                  >
                    {members
                      .filter((m) => m.id !== currentMember.id)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                  </select>
                  <input
                    type="date"
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="domus-input text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <select
                    value={bookDuration}
                    onChange={(e) => setBookDuration(Number(e.target.value))}
                    className="domus-input text-xs"
                  >
                    <option value={30}>30 mins</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                  </select>
                  <select
                    value={bookCategory}
                    onChange={(e) => setBookCategory(e.target.value)}
                    className="domus-input text-xs"
                  >
                    <option value="DRIVING">Driving</option>
                    <option value="YOGA">Yoga</option>
                    <option value="DIET">Meal Prep</option>
                    <option value="SHOPPING">Shopping</option>
                    <option value="CHORE">Chore</option>
                  </select>
                </div>

                <div className="grid max-h-32 grid-cols-2 gap-1.5 overflow-y-auto">
                  {slots.map((slot) => {
                    const active = selectedSlot?.startTime === slot.startTime;
                    return (
                      <button
                        key={slot.startTime}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`rounded-xl border px-2 py-1.5 text-left text-[11px] font-semibold ${
                          active
                            ? "border-terracotta-500 bg-terracotta-50 text-terracotta-700"
                            : "border-stone-200 bg-white text-stone-700"
                        }`}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>

                <input
                  required
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="Purpose (e.g., Driving practice)..."
                  className="domus-input text-xs"
                />
                <input
                  value={bookNotes}
                  onChange={(e) => setBookNotes(e.target.value)}
                  placeholder="Notes (optional)..."
                  className="domus-input text-xs"
                />

                <button
                  type="submit"
                  disabled={!selectedSlot}
                  className="domus-btn-accent w-full text-xs"
                >
                  Send Booking Request
                </button>
              </form>
            )}
          </div>

          <div className="domus-card p-5">
            <h3 className="mb-3 text-sm font-bold text-stone-900">
              Booking Queue
            </h3>
            <div className="space-y-2.5">
              {bookings.slice(0, 5).map((bk) => {
                const req = memberById.get(bk.requesterId);
                const tgt = memberById.get(bk.targetMemberId);
                const isPending =
                  bk.status === "PENDING" ||
                  bk.status === "AWAITING_HEAD_APPROVAL";
                return (
                  <div key={bk.id} className="domus-tile p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-stone-900">
                          {bk.title}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          {req?.name} → {tgt?.name} ·{" "}
                          {formatShortDate(bk.startTime)}
                        </p>
                      </div>
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-600">
                        {bk.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    {isPending && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {bk.status === "AWAITING_HEAD_APPROVAL" && canApprove && (
                          <button
                            onClick={() => handleBookingAction(bk.id, "APPROVE")}
                            className="domus-btn-accent px-2.5 py-1 text-[11px]"
                          >
                            Approve
                          </button>
                        )}
                        {bk.status === "PENDING" &&
                          (bk.targetMemberId === currentMember.id ||
                            canApprove) && (
                            <button
                              onClick={() =>
                                handleBookingAction(bk.id, "ACCEPT")
                              }
                              className="domus-btn-primary px-2.5 py-1 text-[11px]"
                            >
                              Accept
                            </button>
                          )}
                        {(bk.targetMemberId === currentMember.id ||
                          canApprove) && (
                          <button
                            onClick={() => handleBookingAction(bk.id, "DECLINE")}
                            className="domus-btn-secondary px-2.5 py-1 text-[11px]"
                          >
                            Decline
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
