"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarPlus,
  Clock,
  Layers,
  Lock,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { can, canEditOrDeleteEvent, MemberContext } from "@/lib/rbac";
import {
  CalendarEventDTO,
  formatShortDate,
  formatTimeRange,
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

export default function CalendarView({
  currentMember,
  members,
  initialBookMemberId,
}: CalendarViewProps) {
  const [events, setEvents] = useState<CalendarEventDTO[]>([]);
  const [bookings, setBookings] = useState<TimeBookingDTO[]>([]);
  const [modeFilter, setModeFilter] = useState<"ALL" | "OVERLAP" | "INDIVIDUAL">(
    "ALL"
  );
  const [memberFilter, setMemberFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  // Add event form
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [evtTitle, setEvtTitle] = useState("");
  const [evtCategory, setEvtCategory] = useState("FAMILY");
  const [evtDate, setEvtDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [evtStart, setEvtStart] = useState("10:00");
  const [evtEnd, setEvtEnd] = useState("11:00");
  const [evtVisibility, setEvtVisibility] = useState<
    "FAMILY" | "ADULTS_ONLY" | "PRIVATE"
  >("FAMILY");
  const [evtShared, setEvtShared] = useState(true);
  const [evtParticipants, setEvtParticipants] = useState<string[]>([]);
  const [evtLocation, setEvtLocation] = useState("");

  // Book someone's time state
  const defaultTarget =
    initialBookMemberId && initialBookMemberId !== currentMember.id
      ? initialBookMemberId
      : members.find((m) => m.id !== currentMember.id)?.id ?? "";
  const [bookTargetId, setBookTargetId] = useState(defaultTarget);
  const [bookDate, setBookDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [bookDuration, setBookDuration] = useState(60);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [bookTitle, setBookTitle] = useState("");
  const [bookNotes, setBookNotes] = useState("");
  const [bookCategory, setBookCategory] = useState("DRIVING");

  const memberById = new Map(members.map((m) => [m.id, m]));

  async function loadAll() {
    setLoading(true);
    try {
      const [evRes, bkRes] = await Promise.all([
        fetch("/api/calendar/events"),
        fetch("/api/calendar/bookings"),
      ]);
      if (evRes.ok) {
        const d = await evRes.json();
        setEvents(d.events ?? []);
      }
      if (bkRes.ok) {
        const d = await bkRes.json();
        setBookings(d.bookings ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [currentMember.id]);

  useEffect(() => {
    if (initialBookMemberId && initialBookMemberId !== currentMember.id) {
      setBookTargetId(initialBookMemberId);
    }
  }, [initialBookMemberId, currentMember.id]);

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
    setShowAddEvent(false);
    setFeedback({ type: "ok", text: "Added to the common calendar." });
    await loadAll();
  }

  async function handleDeleteEvent(id: string) {
    setFeedback(null);
    const res = await fetch(`/api/calendar/events/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setFeedback({ type: "err", text: data.error ?? "Permission denied" });
      return;
    }
    setFeedback({ type: "ok", text: "Event removed." });
    await loadAll();
  }

  async function handleBookTime(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot) {
      setFeedback({ type: "err", text: "Select an available slot first." });
      return;
    }
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
          ? "Booking submitted! Because you are a Junior member, it was sent to Head/Co-Head for approval."
          : "Time-booking request sent!",
    });
    await loadAll();
  }

  async function handleBookingAction(
    id: string,
    action: "ACCEPT" | "DECLINE" | "APPROVE" | "CANCEL"
  ) {
    setFeedback(null);
    const res = await fetch(`/api/calendar/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedback({ type: "err", text: data.error ?? "Action failed" });
      return;
    }
    setFeedback({ type: "ok", text: `Booking updated (${data.status}).` });
    await loadAll();
  }

  const filteredEvents = events.filter((evt) => {
    if (modeFilter === "OVERLAP" && !evt.isFamilyOverlap) return false;
    if (modeFilter === "INDIVIDUAL" && evt.isFamilyOverlap) return false;
    if (
      memberFilter !== "ALL" &&
      evt.ownerId !== memberFilter &&
      !evt.participantIds.includes(memberFilter)
    ) {
      return false;
    }
    return true;
  });

  const canCreate = can(currentMember, "calendar:create_personal");
  const canCreateShared = can(currentMember, "calendar:create_shared");
  const canBook = can(currentMember, "booking:create");
  const canApprove = can(currentMember, "booking:approve_others");

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-terracotta-600">
            Overlap Engine
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">
            Common Calendar &amp; Time-Booking
          </h2>
          <p className="text-sm text-stone-500">
            See overlapping family moments alongside individual routines, and
            book someone&apos;s open time without double-booking.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowAddEvent((v) => !v)}
            className="domus-btn-primary"
          >
            <CalendarPlus className="h-4 w-4" />
            {showAddEvent ? "Close Form" : "Add Plan / Block"}
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={`rounded-xl border px-4 py-2.5 text-sm ${
            feedback.type === "ok"
              ? "border-sage-200 bg-sage-50 text-sage-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Add Event Drawer */}
      {showAddEvent && canCreate && (
        <form onSubmit={handleCreateEvent} className="domus-card space-y-4 p-5">
          <h3 className="text-sm font-semibold text-stone-900">
            Schedule a New Household or Individual Plan
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-stone-600">
                Title
              </label>
              <input
                required
                value={evtTitle}
                onChange={(e) => setEvtTitle(e.target.value)}
                placeholder="e.g., Driving Lesson, Evening Yoga, Grocery Run"
                className="domus-input"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">
                Category
              </label>
              <select
                value={evtCategory}
                onChange={(e) => setEvtCategory(e.target.value)}
                className="domus-input"
              >
                <option value="FAMILY">Family Shared</option>
                <option value="DRIVING">Driving Lessons</option>
                <option value="YOGA">Yoga</option>
                <option value="EXERCISE">Exercise</option>
                <option value="DIET">Diet / Meal Prep</option>
                <option value="SHOPPING">Shopping</option>
                <option value="CHORE">Chore / Lawn</option>
                <option value="PERSONAL">Personal</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">
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
                <option value="FAMILY">Family (Visible to all)</option>
                <option value="ADULTS_ONLY">Adults Only</option>
                <option value="PRIVATE">Private (Shows as Busy)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">
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
              <label className="mb-1 block text-xs font-medium text-stone-600">
                Start Time
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
              <label className="mb-1 block text-xs font-medium text-stone-600">
                End Time
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
              <label className="mb-1 block text-xs font-medium text-stone-600">
                Location
              </label>
              <input
                value={evtLocation}
                onChange={(e) => setEvtLocation(e.target.value)}
                placeholder="Home / Costco / Gym"
                className="domus-input"
              />
            </div>
          </div>

          {canCreateShared && (
            <div className="space-y-2 border-t border-stone-100 pt-3">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-stone-700">
                <input
                  type="checkbox"
                  checked={evtShared}
                  onChange={(e) => setEvtShared(e.target.checked)}
                  className="rounded border-stone-300"
                />
                Mark as Shared / Overlapping Event &amp; invite family members
              </label>
              {evtShared && (
                <div className="flex flex-wrap gap-2">
                  {members
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
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                            active
                              ? "border-stone-900 bg-stone-900 text-white"
                              : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                          }`}
                        >
                          {m.name}
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddEvent(false)}
              className="domus-btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="domus-btn-primary">
              Save to Calendar
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left 7 cols: Unified Calendar Stream */}
        <div className="space-y-4 lg:col-span-7">
          {/* Filters */}
          <div className="domus-card flex flex-wrap items-center justify-between gap-3 p-3.5">
            <div className="flex rounded-xl bg-stone-100 p-1 text-xs font-medium">
              {(
                [
                  ["ALL", "All Plans"],
                  ["OVERLAP", "Overlapping / Shared"],
                  ["INDIVIDUAL", "Individual Only"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setModeFilter(key)}
                  className={`rounded-lg px-3 py-1.5 transition ${
                    modeFilter === key
                      ? "bg-white text-stone-900 shadow-sm"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setMemberFilter("ALL")}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
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
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                    memberFilter === m.id
                      ? "text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
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

          {/* Events List */}
          <div className="space-y-3">
            {loading ? (
              <div className="domus-card p-8 text-center text-sm text-stone-400">
                Loading common calendar...
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="domus-card p-8 text-center text-sm text-stone-500">
                No calendar blocks match this filter.
              </div>
            ) : (
              filteredEvents.map((evt) => {
                const owner = memberById.get(evt.ownerId);
                const removable = canEditOrDeleteEvent(evt, currentMember);
                return (
                  <div
                    key={evt.id}
                    className={`domus-card flex items-start justify-between gap-4 p-4 ${
                      evt.isFamilyOverlap
                        ? "border-l-4 border-l-terracotta-500"
                        : "border-l-4 border-l-stone-300"
                    }`}
                  >
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-600">
                          {evt.category}
                        </span>
                        {evt.isFamilyOverlap ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-terracotta-100 px-2 py-0.5 text-[10px] font-semibold text-terracotta-700">
                            <Layers className="h-3 w-3" />
                            Overlapping / Shared
                          </span>
                        ) : (
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500">
                            Individual
                          </span>
                        )}
                        {evt.isRedacted && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-semibold text-stone-700">
                            <Lock className="h-3 w-3" />
                            Private Block
                          </span>
                        )}
                        {evt.hasCollision && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                            <AlertTriangle className="h-3 w-3" />
                            Schedule Overlap
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-semibold text-stone-900">
                        {evt.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
                        <span className="inline-flex items-center gap-1 font-medium text-stone-700">
                          <Clock className="h-3.5 w-3.5" />
                          {formatShortDate(evt.startTime)} ·{" "}
                          {formatTimeRange(evt.startTime, evt.endTime)}
                        </span>
                        {evt.location && <span>📍 {evt.location}</span>}
                      </div>

                      {evt.notes && !evt.isRedacted && (
                        <p className="text-xs text-stone-500">{evt.notes}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <Users className="h-3.5 w-3.5 text-stone-400" />
                        {evt.participantIds.map((pid) => {
                          const m = memberById.get(pid);
                          if (!m) return null;
                          return (
                            <span
                              key={pid}
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                              style={{ backgroundColor: m.color }}
                            >
                              {m.name}
                            </span>
                          );
                        })}
                        {evt.participantIds.length === 0 && owner && (
                          <span className="text-xs text-stone-500">
                            {owner.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {removable && !evt.isRedacted && (
                      <button
                        onClick={() => handleDeleteEvent(evt.id)}
                        title="Remove event"
                        className="rounded-lg p-1.5 text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 5 cols: Book Someone's Time + Bookings Queue */}
        <div className="space-y-6 lg:col-span-5">
          <div className="domus-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-terracotta-500" />
              <h3 className="text-sm font-semibold text-stone-900">
                Book a Family Member&apos;s Time
              </h3>
            </div>

            {!canBook ? (
              <p className="rounded-xl bg-stone-50 p-4 text-xs text-stone-500">
                Guests have read-only calendar access and cannot book family
                members&apos; time.
              </p>
            ) : (
              <form onSubmit={handleBookTime} className="space-y-3.5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-600">
                      Who do you need?
                    </label>
                    <select
                      value={bookTargetId}
                      onChange={(e) => setBookTargetId(e.target.value)}
                      className="domus-input"
                    >
                      {members
                        .filter((m) => m.id !== currentMember.id)
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.role})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-600">
                      Date
                    </label>
                    <input
                      type="date"
                      value={bookDate}
                      onChange={(e) => setBookDate(e.target.value)}
                      className="domus-input"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-600">
                      Duration
                    </label>
                    <select
                      value={bookDuration}
                      onChange={(e) => setBookDuration(Number(e.target.value))}
                      className="domus-input"
                    >
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={90}>1.5 hours</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-600">
                      Activity Type
                    </label>
                    <select
                      value={bookCategory}
                      onChange={(e) => setBookCategory(e.target.value)}
                      className="domus-input"
                    >
                      <option value="DRIVING">Driving Practice</option>
                      <option value="YOGA">Yoga / Workout</option>
                      <option value="DIET">Meal Prep</option>
                      <option value="SHOPPING">Shopping / Errand</option>
                      <option value="CHORE">Home / Yard Help</option>
                      <option value="BOOKING">General Time</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-stone-600">
                    Open Conflict-Free Slots ({slots.length} available)
                  </label>
                  {slots.length === 0 ? (
                    <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                      No completely open slots found on this day. Try another
                      date or shorter duration.
                    </p>
                  ) : (
                    <div className="grid max-h-36 grid-cols-2 gap-1.5 overflow-y-auto pr-1">
                      {slots.map((slot) => {
                        const active =
                          selectedSlot?.startTime === slot.startTime;
                        return (
                          <button
                            key={slot.startTime}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition ${
                              active
                                ? "border-terracotta-500 bg-terracotta-50 text-terracotta-700"
                                : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-white"
                            }`}
                          >
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600">
                    What is this time for?
                  </label>
                  <input
                    required
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    placeholder="e.g., Parallel parking practice before DMV test"
                    className="domus-input"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600">
                    Notes (optional)
                  </label>
                  <input
                    value={bookNotes}
                    onChange={(e) => setBookNotes(e.target.value)}
                    placeholder="Any prep needed or location details"
                    className="domus-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedSlot}
                  className="domus-btn-accent w-full"
                >
                  Send Time-Booking Request
                </button>
              </form>
            )}
          </div>

          {/* All Bookings History / Queue */}
          <div className="domus-card p-5">
            <h3 className="mb-3 text-sm font-semibold text-stone-900">
              Household Booking Queue
            </h3>
            <div className="space-y-2.5">
              {bookings.map((bk) => {
                const req = memberById.get(bk.requesterId);
                const tgt = memberById.get(bk.targetMemberId);
                const isPending =
                  bk.status === "PENDING" ||
                  bk.status === "AWAITING_HEAD_APPROVAL";

                return (
                  <div
                    key={bk.id}
                    className="rounded-xl border border-stone-200/80 bg-stone-50/70 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-stone-900">
                          {bk.title}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          {req?.name} → {tgt?.name} ·{" "}
                          {formatShortDate(bk.startTime)}{" "}
                          {formatTimeRange(bk.startTime, bk.endTime)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          bk.status === "ACCEPTED"
                            ? "bg-sage-100 text-sage-700"
                            : bk.status === "DECLINED" ||
                                bk.status === "CANCELLED"
                              ? "bg-stone-200 text-stone-600"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {bk.status.replaceAll("_", " ")}
                      </span>
                    </div>

                    {isPending && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {bk.status === "AWAITING_HEAD_APPROVAL" && canApprove && (
                          <button
                            onClick={() => handleBookingAction(bk.id, "APPROVE")}
                            className="rounded-lg bg-sage-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-sage-700"
                          >
                            Approve (Head)
                          </button>
                        )}
                        {bk.status === "PENDING" &&
                          (bk.targetMemberId === currentMember.id ||
                            canApprove) && (
                            <button
                              onClick={() =>
                                handleBookingAction(bk.id, "ACCEPT")
                              }
                              className="rounded-lg bg-stone-900 px-2.5 py-1 text-[11px] font-medium text-white"
                            >
                              Accept &amp; Add to Calendar
                            </button>
                          )}
                        {(bk.targetMemberId === currentMember.id ||
                          canApprove) && (
                          <button
                            onClick={() => handleBookingAction(bk.id, "DECLINE")}
                            className="rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-600"
                          >
                            Decline
                          </button>
                        )}
                        {bk.requesterId === currentMember.id && (
                          <button
                            onClick={() => handleBookingAction(bk.id, "CANCEL")}
                            className="rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-500"
                          >
                            Cancel
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
