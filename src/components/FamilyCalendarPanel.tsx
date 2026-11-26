"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Cake,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { getPublicHolidaysForYear } from "@/lib/holidays";
import { getMiniatureByIdOrSrc } from "@/lib/miniatures";
import type { MemberContext } from "@/lib/rbac";
import MemberAvatar from "./MemberAvatar";
import MiniaturePicker from "./MiniaturePicker";
import type { CalendarEventDTO, HouseholdListDTO, MemberDTO } from "./types";

interface FamilyCalendarPanelProps {
  currentMember: MemberContext;
  members: MemberDTO[];
  events: CalendarEventDTO[];
  lists: HouseholdListDTO[];
  onRefresh: () => Promise<void>;
  personalOnly?: boolean;
  ownerName?: string;
}

interface UnifiedCalEntry {
  id: string;
  eventId?: string;
  title: string;
  dateKey: string; // YYYY-MM-DD
  kind: "HOLIDAY" | "BIRTHDAY" | "EVENT" | "LIST_ITEM";
  allDay: boolean;
  startHour?: number; // 0..23.99
  endHour?: number;
  timeLabel?: string;
  participantIds: string[];
  ownerId?: string;
  location?: string;
  notes?: string;
  listTitle?: string;
  iconSrc?: string;
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function formatHourShort(hour: number): string {
  const h = Math.floor(hour);
  const mins = Math.round((hour - h) * 60);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return mins === 0
    ? `${h12} ${suffix}`
    : `${h12}:${String(mins).padStart(2, "0")} ${suffix}`;
}

function parseLocalTimeFromIso(iso: string): {
  dateKey: string;
  hour: number;
} {
  // Handle both "YYYY-MM-DDTHH:MM:00" local strings and ISO strings
  const match = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
  if (match) {
    return {
      dateKey: match[1],
      hour: Number(match[2]) + Number(match[3]) / 60,
    };
  }
  const d = new Date(iso);
  return {
    dateKey: toDateKey(d),
    hour: d.getHours() + d.getMinutes() / 60,
  };
}

export default function FamilyCalendarPanel({
  currentMember,
  members,
  events,
  lists,
  onRefresh,
  personalOnly = false,
  ownerName,
}: FamilyCalendarPanelProps) {
  const [view, setView] = useState<"MONTH" | "WEEK" | "DAY">("MONTH");
  const [scope, setScope] = useState<"ALL" | "MINE">(
    personalOnly ? "MINE" : "ALL"
  );
  const [cursorDate, setCursorDate] = useState<Date>(() => new Date());

  // Clicked-day Google-Calendar-style detail sheet
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  // Add Event / Task / Birthday modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState(() => toDateKey(new Date()));
  const [eventCategory, setEventCategory] = useState<
    "FAMILY" | "BIRTHDAY" | "HOLIDAY"
  >("FAMILY");
  const [isAllDay, setIsAllDay] = useState(false);
  const [startTimeStr, setStartTimeStr] = useState("14:00");
  const [endTimeStr, setEndTimeStr] = useState("15:00");
  const [participantIds, setParticipantIds] = useState<string[]>([
    currentMember.id,
  ]);
  const [eventLocation, setEventLocation] = useState("");
  const [eventIconId, setEventIconId] = useState("");
  const [eventNotes, setEventNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const memberById = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m])),
    [members]
  );

  const displayYear = cursorDate.getFullYear();
  const displayMonth = cursorDate.getMonth();
  const todayKey = toDateKey(new Date());

  function openAddModal(dateKey: string, defaultHour?: number) {
    setEventDate(dateKey);
    setEventTitle("");
    setEventCategory("FAMILY");
    setEventLocation("");
    setEventIconId("");
    setEventNotes("");
    setFormError(null);
    setParticipantIds([currentMember.id]);
    if (defaultHour !== undefined) {
      setIsAllDay(false);
      const startH = Math.max(0, Math.min(22, defaultHour));
      const endH = Math.min(23, startH + 1);
      setStartTimeStr(`${String(startH).padStart(2, "0")}:00`);
      setEndTimeStr(`${String(endH).padStart(2, "0")}:00`);
    } else {
      setIsAllDay(false);
      setStartTimeStr("14:00");
      setEndTimeStr("15:00");
    }
    setAddModalOpen(true);
  }

  function toggleParticipant(id: string) {
    setParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  const allSelected =
    members.length > 0 && members.every((m) => participantIds.includes(m.id));

  function toggleEveryone() {
    if (allSelected) {
      setParticipantIds([currentMember.id]);
    } else {
      setParticipantIds(members.map((m) => m.id));
    }
  }

  async function handleSaveEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDate) return;
    setFormError(null);

    const effectiveAllDay =
      isAllDay || eventCategory === "BIRTHDAY" || eventCategory === "HOLIDAY";
    const sStr = effectiveAllDay ? "00:00" : startTimeStr;
    const eStr = effectiveAllDay ? "23:59" : endTimeStr;

    if (!effectiveAllDay && eStr <= sStr) {
      setFormError("End time must be after start time.");
      return;
    }

    setSaving(true);
    try {
      const startTime = `${eventDate}T${sStr}:00`;
      const endTime = `${eventDate}T${eStr}:00`;
      const isPersonal = scope === "MINE" && eventCategory === "FAMILY";
      const involved = isPersonal
        ? [currentMember.id]
        : eventCategory === "BIRTHDAY" || eventCategory === "HOLIDAY"
        ? members.map((m) => m.id)
        : participantIds.length > 0
        ? participantIds
        : [currentMember.id];

      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eventTitle.trim(),
          category: isPersonal ? "PERSONAL" : eventCategory,
          startTime,
          endTime,
          participantIds: involved,
          visibility: isPersonal ? "PRIVATE" : "FAMILY",
          isShared: !isPersonal && (involved.length > 1 || eventCategory !== "FAMILY"),
          location: eventIconId
            ? `icon:${eventIconId}`
            : eventLocation.trim(),
          notes: eventNotes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Could not save event.");
        return;
      }
      setAddModalOpen(false);
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteEvent(eventId: string) {
    await fetch(`/api/calendar/events?id=${encodeURIComponent(eventId)}`, {
      method: "DELETE",
    });
    await onRefresh();
  }

  // Unified entries map across Holidays + Saved Events + Dated Shared List Items
  const entriesByDate = useMemo(() => {
    const map: Record<string, UnifiedCalEntry[]> = {};
    const push = (entry: UnifiedCalEntry) => {
      if (!map[entry.dateKey]) map[entry.dateKey] = [];
      map[entry.dateKey].push(entry);
    };

    // 1. Public holidays
    for (const h of getPublicHolidaysForYear(displayYear)) {
      push({
        id: `hol-${h.date}-${h.title}`,
        title: h.title,
        dateKey: h.date,
        kind: "HOLIDAY",
        allDay: true,
        participantIds: [],
      });
    }

    // 2. Saved family/personal events & birthdays
    for (const ev of events) {
      const start = parseLocalTimeFromIso(ev.startTime);
      const end = parseLocalTimeFromIso(ev.endTime);
      const involved = Array.from(
        new Set([...(ev.participantIds ?? []), ...(ev.participantIds?.length ? [] : [ev.ownerId])])
      );

      // Scope rules:
      // - ALL HOUSE: shows shared house events, birthdays & holidays (hides private personal events!)
      // - MY CALENDAR: shows your own private events + any house events where you're involved + birthdays & holidays
      if (scope === "ALL" && ev.visibility === "PRIVATE") {
        continue;
      }
      if (
        scope === "MINE" &&
        ev.category !== "BIRTHDAY" &&
        ev.category !== "HOLIDAY" &&
        ev.ownerId !== currentMember.id &&
        !involved.includes(currentMember.id)
      ) {
        continue;
      }

      const isBday = ev.category === "BIRTHDAY";
      const isHol = ev.category === "HOLIDAY";
      const allDay =
        isBday ||
        isHol ||
        (start.hour === 0 && end.hour >= 23.5) ||
        (start.hour === 9 && end.hour === 10 && ev.startTime.endsWith("Z"));

      const dateKey = isBday
        ? `${displayYear}-${start.dateKey.slice(5, 10)}`
        : start.dateKey;

      const isIconLoc = Boolean(ev.location?.startsWith("icon:"));
      const iconMini = isIconLoc
        ? getMiniatureByIdOrSrc(ev.location?.slice(5))
        : null;

      push({
        id: ev.id,
        eventId: ev.id,
        title: ev.title,
        dateKey,
        kind: isBday ? "BIRTHDAY" : isHol ? "HOLIDAY" : "EVENT",
        allDay,
        startHour: allDay ? undefined : start.hour,
        endHour: allDay ? undefined : end.hour,
        timeLabel: allDay
          ? undefined
          : `${formatHourShort(start.hour)} – ${formatHourShort(end.hour)}`,
        participantIds: involved,
        ownerId: ev.ownerId,
        location: isIconLoc ? "" : ev.location,
        notes: ev.notes,
        iconSrc: iconMini?.src,
      });
    }

    // 3. Dated Shared Lists AND Dated Shared List Items (both can have independent dates!)
    for (const list of lists) {
      if (list.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(list.dueDate)) {
        const isBirthday = /birthday|bday/i.test(list.title);
        const dateKey = isBirthday
          ? `${displayYear}-${list.dueDate.slice(5, 10)}`
          : list.dueDate;
        push({
          id: `list-${list.id}`,
          title: list.title,
          dateKey,
          kind: isBirthday ? "BIRTHDAY" : "LIST_ITEM",
          allDay: true,
          participantIds: [],
          listTitle: "Shared List",
        });
      }

      for (const item of list.items) {
        if (item.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(item.dueDate)) {
          const isBirthday =
            /birthday|bday/i.test(item.title) ||
            /birthday|bday/i.test(list.title);
          if (
            scope === "MINE" &&
            !isBirthday &&
            item.assigneeId &&
            item.assigneeId !== currentMember.id
          ) {
            continue;
          }
          const dateKey = isBirthday
            ? `${displayYear}-${item.dueDate.slice(5, 10)}`
            : item.dueDate;
          // Avoid duplicate pill if this task already has a timed Calendar Event on the same day
          const alreadyScheduled = (map[dateKey] ?? []).some(
            (e) =>
              e.kind === "EVENT" &&
              e.title.trim().toLowerCase() === item.title.trim().toLowerCase()
          );
          if (alreadyScheduled) continue;
          push({
            id: `li-${item.id}`,
            title: item.title,
            dateKey,
            kind: isBirthday ? "BIRTHDAY" : "LIST_ITEM",
            allDay: true,
            participantIds: item.assigneeId ? [item.assigneeId] : [],
            listTitle: list.title,
          });
        }
      }
    }

    // Sort each day's entries: all-day first, then chronological by startHour
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => {
        if (a.allDay && !b.allDay) return -1;
        if (!a.allDay && b.allDay) return 1;
        return (a.startHour ?? 0) - (b.startHour ?? 0);
      });
    }

    return map;
  }, [displayYear, events, lists, scope, currentMember.id]);

  // Month cells
  const monthDays = useMemo(() => {
    const firstDay = new Date(displayYear, displayMonth, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
    const cells: Array<{ date: Date | null; key: string }> = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push({ date: null, key: `empty-${i}` });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(displayYear, displayMonth, d);
      cells.push({ date: dt, key: toDateKey(dt) });
    }
    return cells;
  }, [displayYear, displayMonth]);

  // Week days (Sun..Sat containing cursorDate)
  const weekDays = useMemo(() => {
    const start = new Date(cursorDate);
    start.setDate(cursorDate.getDate() - cursorDate.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const dt = new Date(start);
      dt.setDate(start.getDate() + i);
      return { date: dt, key: toDateKey(dt) };
    });
  }, [cursorDate]);

  // Navigation
  function stepCursor(dir: -1 | 1) {
    const next = new Date(cursorDate);
    if (view === "MONTH") {
      next.setMonth(next.getMonth() + dir);
    } else if (view === "WEEK") {
      next.setDate(next.getDate() + dir * 7);
    } else {
      next.setDate(next.getDate() + dir);
    }
    setCursorDate(next);
  }

  const headerLabel = useMemo(() => {
    if (view === "MONTH") {
      return cursorDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }
    if (view === "WEEK") {
      const s = weekDays[0].date;
      const e = weekDays[6].date;
      return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    }
    return cursorDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }, [view, cursorDate, weekDays]);

  const activeDayKey = toDateKey(cursorDate);
  const activeDayEntries = entriesByDate[activeDayKey] ?? [];
  const selectedDayEntries = selectedDayKey
    ? entriesByDate[selectedDayKey] ?? []
    : [];

  const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM .. 10 PM

  return (
    <section className="domus-card p-4 sm:p-5 lg:sticky lg:top-20 lg:col-span-5">
      {/* Top Header */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/calendar-3d.png"
            alt="Family Calendar"
            className="h-8 w-8 shrink-0 object-contain mix-blend-multiply"
          />
          <div>
            <h2 className="text-base font-extrabold leading-tight tracking-tight text-[#1e1916]">
              {personalOnly
                ? ownerName
                  ? `${ownerName}'s Calendar`
                  : "My Personal Calendar"
                : scope === "MINE"
                ? "My Calendar"
                : "Family Calendar"}
            </h2>
            <p className="text-[10px] text-[#6b5d53]">
              {personalOnly
                ? "Your private schedule & house events involving you"
                : "Holidays, birthdays, shared plans & list dates"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openAddModal(view === "DAY" ? activeDayKey : todayKey)}
          className="domus-btn-accent px-3 py-1.5 text-[11px]"
        >
          <Plus className="h-3 w-3" />
          Schedule
        </button>
      </div>

      {/* View Switcher (Month | Week | Day) + Scope Toggle (All House | My Calendar) */}
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-xl bg-[#f3ede4] p-0.5 text-[11px] font-bold">
          {(["MONTH", "WEEK", "DAY"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-lg px-2.5 py-1 capitalize transition ${
                view === v
                  ? "bg-[#1f332b] text-white shadow-sm"
                  : "text-[#5c5047] hover:text-[#1e1916]"
              }`}
            >
              {v.toLowerCase()}
            </button>
          ))}
        </div>

        {!personalOnly && (
          <div className="inline-flex rounded-xl bg-[#f3ede4] p-0.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setScope("ALL")}
              className={`rounded-lg px-2 py-1 transition ${
                scope === "ALL"
                  ? "bg-white text-[#1e1916] shadow-sm"
                  : "text-[#6b5d53]"
              }`}
            >
              All House
            </button>
            <button
              type="button"
              onClick={() => setScope("MINE")}
              className={`rounded-lg px-2 py-1 transition ${
                scope === "MINE"
                  ? "bg-white text-[#1e1916] shadow-sm"
                  : "text-[#6b5d53]"
              }`}
            >
              My Calendar
            </button>
          </div>
        )}
      </div>

      {/* Date Navigation */}
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded-xl bg-[#f3ede4] p-0.5">
          <button
            type="button"
            onClick={() => stepCursor(-1)}
            className="rounded-lg p-1 text-[#4e433b] hover:bg-white"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[120px] text-center text-xs font-extrabold text-[#1e1916]">
            {headerLabel}
          </span>
          <button
            type="button"
            onClick={() => stepCursor(1)}
            className="rounded-lg p-1 text-[#4e433b] hover:bg-white"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setCursorDate(new Date())}
          className="domus-btn-secondary px-2.5 py-1 text-[11px]"
        >
          Today
        </button>
      </div>

      {/* Legend */}
      <div className="mb-2 flex flex-wrap items-center gap-2.5 text-[10px] font-semibold text-[#6b5d53]">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-sky-500" />
          Holiday
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          Birthday
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-sage-600" />
          Event
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          List
        </span>
      </div>

      {/* VIEW 1: MONTH GRID */}
      {view === "MONTH" && (
        <div className="grid grid-cols-7 gap-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
            <div
              key={`${day}-${idx}`}
              className="py-1 text-center text-[10px] font-bold uppercase text-[#7c6e63]"
            >
              {day}
            </div>
          ))}

          {monthDays.map((cell) => {
            if (!cell.date) {
              return (
                <div
                  key={cell.key}
                  className="min-h-[54px] rounded-xl bg-[#f3ede4]/35"
                />
              );
            }

            const dayEntries = entriesByDate[cell.key] ?? [];
            const isToday = cell.key === todayKey;

            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => setSelectedDayKey(cell.key)}
                title={
                  dayEntries.length > 0
                    ? dayEntries.map((e) => e.title).join(" · ")
                    : `Open ${cell.key}`
                }
                className={`flex min-h-[54px] flex-col items-start gap-0.5 rounded-xl p-1 text-left transition ${
                  isToday
                    ? "bg-terracotta-50 ring-2 ring-terracotta-500"
                    : "bg-[#f3ede4]/75 hover:bg-[#ece3d6]"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                    isToday ? "bg-terracotta-500 text-white" : "text-[#3d342e]"
                  }`}
                >
                  {cell.date.getDate()}
                </span>

                <div className="w-full space-y-0.5">
                  {dayEntries.slice(0, 2).map((entry) => (
                    <div
                      key={entry.id}
                      className={`truncate rounded px-1 py-0.5 text-[9px] font-bold leading-none ${
                        entry.kind === "HOLIDAY"
                          ? "bg-sky-100 text-sky-900"
                          : entry.kind === "BIRTHDAY"
                          ? "bg-rose-100 text-rose-900"
                          : entry.kind === "LIST_ITEM"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-sage-100 text-sage-900"
                      }`}
                    >
                      {entry.kind === "BIRTHDAY" ? "🎂 " : ""}
                      {entry.startHour !== undefined
                        ? `${formatHourShort(entry.startHour).replace(" ", "").toLowerCase()} `
                        : ""}
                      {entry.title}
                    </div>
                  ))}
                  {dayEntries.length > 2 && (
                    <p className="px-0.5 text-[9px] font-bold text-[#6b5d53]">
                      +{dayEntries.length - 2}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* VIEW 2: WEEK VIEW */}
      {view === "WEEK" && (
        <div className="max-h-[430px] space-y-2 overflow-y-auto pr-1">
          {weekDays.map(({ date, key }) => {
            const items = entriesByDate[key] ?? [];
            const isToday = key === todayKey;
            return (
              <div
                key={key}
                onClick={() => setSelectedDayKey(key)}
                className={`cursor-pointer rounded-2xl p-2.5 transition ${
                  isToday
                    ? "bg-terracotta-50 ring-2 ring-terracotta-500"
                    : "bg-[#f3ede4]/80 hover:bg-[#ece3d6]"
                }`}
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold ${
                        isToday
                          ? "bg-terracotta-500 text-white"
                          : "bg-white text-[#1e1916]"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    <span className="text-xs font-extrabold text-[#1e1916]">
                      {date.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAddModal(key);
                    }}
                    className="rounded-lg bg-white/80 px-2 py-0.5 text-[10px] font-bold text-[#5c5047] hover:bg-white hover:text-[#1e1916]"
                  >
                    + Add
                  </button>
                </div>

                {items.length === 0 ? (
                  <p className="pl-8 text-[11px] text-[#8a7c71]">
                    Open day — click to schedule
                  </p>
                ) : (
                  <div className="space-y-1 pl-8">
                    {items.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between gap-2 rounded-xl bg-white/85 px-2.5 py-1.5 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-[#1e1916]">
                            {entry.kind === "BIRTHDAY" ? "🎂 " : ""}
                            {entry.title}
                          </p>
                          {entry.timeLabel && (
                            <p className="text-[10px] font-semibold text-terracotta-600">
                              {entry.timeLabel}
                            </p>
                          )}
                        </div>
                        {entry.participantIds.length > 0 && (
                          <div className="flex -space-x-1">
                            {entry.participantIds.slice(0, 3).map((pid) => {
                              const m = memberById[pid];
                              if (!m) return null;
                              return (
                                <MemberAvatar
                                  key={pid}
                                  initials={m.avatarInitials}
                                  color={m.color}
                                  avatarId={m.avatarId}
                                  size="sm"
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: DAY HOURLY TIMELINE (Google Calendar Style!) */}
      {view === "DAY" && (
        <div className="space-y-2.5">
          {/* All-day strip */}
          {activeDayEntries.some((e) => e.allDay) && (
            <div className="flex flex-wrap gap-1.5 rounded-2xl bg-[#f3ede4] p-2">
              {activeDayEntries
                .filter((e) => e.allDay)
                .map((entry) => (
                  <span
                    key={entry.id}
                    className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                      entry.kind === "HOLIDAY"
                        ? "bg-sky-100 text-sky-900"
                        : entry.kind === "BIRTHDAY"
                        ? "bg-rose-100 text-rose-900"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {entry.kind === "BIRTHDAY" ? "🎂 " : ""}
                    {entry.title}
                  </span>
                ))}
            </div>
          )}

          {/* Hourly Slots 6 AM - 10 PM */}
          <div className="max-h-[380px] space-y-1 overflow-y-auto pr-1">
            {HOURS.map((hour) => {
              const slotEvents = activeDayEntries.filter(
                (e) =>
                  !e.allDay &&
                  e.startHour !== undefined &&
                  Math.floor(e.startHour) === hour
              );
              return (
                <div
                  key={hour}
                  onClick={() => openAddModal(activeDayKey, hour)}
                  className="group flex min-h-[36px] cursor-pointer items-start gap-2 rounded-xl border border-transparent px-1.5 py-1 transition hover:border-[#dfd4c6] hover:bg-[#f3ede4]/60"
                >
                  <span className="w-12 shrink-0 pt-0.5 text-right text-[10px] font-bold text-[#7c6e63]">
                    {formatHourShort(hour)}
                  </span>
                  <div className="min-w-0 flex-1 border-t border-[#e8dfd3] pt-1">
                    {slotEvents.length === 0 ? (
                      <span className="text-[10px] font-semibold text-terracotta-500 opacity-0 transition group-hover:opacity-100">
                        + Schedule at {formatHourShort(hour)}
                      </span>
                    ) : (
                      <div className="space-y-1">
                        {slotEvents.map((ev) => (
                          <div
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDayKey(activeDayKey);
                            }}
                            className="flex items-center justify-between gap-2 rounded-xl bg-sage-100 px-2.5 py-1.5 text-xs text-sage-950 shadow-sm"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-extrabold">
                                {ev.title}
                              </p>
                              <p className="text-[10px] font-semibold text-sage-800">
                                {ev.timeLabel}
                                {ev.location ? ` · ${ev.location}` : ""}
                              </p>
                            </div>
                            <div className="flex shrink-0 -space-x-1">
                              {ev.participantIds.slice(0, 3).map((pid) => {
                                const m = memberById[pid];
                                if (!m) return null;
                                return (
                                  <MemberAvatar
                                    key={pid}
                                    initials={m.avatarInitials}
                                    color={m.color}
                                    avatarId={m.avatarId}
                                    size="sm"
                                  />
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAY DETAIL MODAL (Opens when clicking any day — shows ALL events, tasks, birthdays, holidays!) */}
      <AnimatePresence>
        {selectedDayKey && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedDayKey(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d1714]/40 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="domus-card relative w-full max-w-md space-y-4 p-6 sm:p-7"
            >
              <button
                type="button"
                onClick={() => setSelectedDayKey(null)}
                className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-[#efe7dc] text-[#5c5047] hover:bg-[#e5d9ca]"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="pr-8">
                <p className="text-[11px] font-bold uppercase tracking-wider text-terracotta-600">
                  Day Schedule
                </p>
                <h3 className="text-lg font-extrabold text-[#1e1916]">
                  {parseDateKey(selectedDayKey).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h3>
              </div>

              {selectedDayEntries.length === 0 ? (
                <div className="rounded-2xl bg-[#f3ede4] p-5 text-center">
                  <p className="text-xs font-semibold text-[#5c5047]">
                    Nothing scheduled for this day yet.
                  </p>
                </div>
              ) : (
                <div className="max-h-[320px] space-y-2.5 overflow-y-auto pr-1">
                  {selectedDayEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="space-y-1.5 rounded-2xl bg-[#f3ede4] p-3.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-start gap-2.5">
                          {entry.iconSrc && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={entry.iconSrc}
                              alt=""
                              className="mt-0.5 h-8 w-8 shrink-0 object-contain mix-blend-multiply"
                            />
                          )}
                          <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                                entry.kind === "HOLIDAY"
                                  ? "bg-sky-100 text-sky-900"
                                  : entry.kind === "BIRTHDAY"
                                  ? "bg-rose-100 text-rose-900"
                                  : entry.kind === "LIST_ITEM"
                                  ? "bg-amber-100 text-amber-900"
                                  : "bg-sage-100 text-sage-900"
                              }`}
                            >
                              {entry.kind === "HOLIDAY"
                                ? "Holiday"
                                : entry.kind === "BIRTHDAY"
                                ? "🎂 Birthday"
                                : entry.kind === "LIST_ITEM"
                                ? `List: ${entry.listTitle}`
                                : "Scheduled"}
                            </span>
                            {entry.timeLabel && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-terracotta-600">
                                <Clock className="h-3 w-3" />
                                {entry.timeLabel}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm font-extrabold text-[#1e1916]">
                            {entry.title}
                          </p>
                          </div>
                        </div>

                        {entry.eventId && (
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(entry.eventId!)}
                            title="Delete event"
                            className="rounded-lg p-1 text-[#8a7c71] hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {entry.location && (
                        <p className="inline-flex items-center gap-1 text-[11px] text-[#5c5047]">
                          <MapPin className="h-3 w-3" />
                          {entry.location}
                        </p>
                      )}

                      {entry.notes && (
                        <p className="text-xs text-[#5c5047]">{entry.notes}</p>
                      )}

                      {entry.participantIds.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-bold text-[#7c6e63]">
                            Involved:
                          </span>
                          {entry.participantIds.map((pid) => {
                            const m = memberById[pid];
                            if (!m) return null;
                            return (
                              <span
                                key={pid}
                                className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#1e1916]"
                              >
                                <MemberAvatar
                                  initials={m.avatarInitials}
                                  color={m.color}
                                  avatarId={m.avatarId}
                                  size="sm"
                                />
                                {m.name}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setCursorDate(parseDateKey(selectedDayKey));
                    setView("DAY");
                    setSelectedDayKey(null);
                  }}
                  className="domus-btn-secondary flex-1 py-2.5 text-xs"
                >
                  Open Hourly View
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const dk = selectedDayKey;
                    setSelectedDayKey(null);
                    openAddModal(dk);
                  }}
                  className="domus-btn-accent flex-1 py-2.5 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Event / Task
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD EVENT / TASK / BIRTHDAY MODAL (With Time + Who's Involved!) */}
      <AnimatePresence>
        {addModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAddModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d1714]/40 p-4 backdrop-blur-md"
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleSaveEvent}
              className="domus-card relative w-full max-w-md space-y-4 p-6 sm:p-7"
            >
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-[#efe7dc] text-[#5c5047] hover:bg-[#e5d9ca]"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="pr-8">
                <h3 className="text-base font-extrabold text-[#1e1916]">
                  {scope === "MINE"
                    ? "Add to My Calendar"
                    : "Schedule for the House"}
                </h3>
                <p className="mt-0.5 text-xs text-[#6b5d53]">
                  {scope === "MINE"
                    ? "Private to your personal calendar — won't clutter the house calendar."
                    : "Add a shared family plan, meeting, or yearly birthday — syncs to everyone involved."}
                </p>
              </div>

              {/* Type Selector (only needed on All House; My Calendar is personal events/tasks) */}
              {scope === "ALL" && (
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      {
                        id: "FAMILY",
                        label: "Event / Task",
                        icon: <CalendarIcon className="h-3.5 w-3.5" />,
                      },
                      {
                        id: "BIRTHDAY",
                        label: "Birthday",
                        icon: <Cake className="h-3.5 w-3.5" />,
                      },
                      {
                        id: "HOLIDAY",
                        label: "Holiday",
                        icon: <Sparkles className="h-3.5 w-3.5" />,
                      },
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setEventCategory(cat.id)}
                      className={`flex items-center justify-center gap-1.5 rounded-2xl py-2 text-xs font-bold transition ${
                        eventCategory === cat.id
                          ? "bg-[#1f332b] text-white shadow-sm"
                          : "bg-[#f3ede4] text-[#5c5047] hover:bg-[#e8dfd3]"
                      }`}
                    >
                      {cat.icon}
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-bold text-[#4e433b]">
                  Title <span className="text-terracotta-500">*</span>
                </label>
                <input
                  autoFocus
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder={
                    scope === "MINE"
                      ? "e.g., Study session, Dentist, Gym..."
                      : eventCategory === "BIRTHDAY"
                      ? "e.g., Aunt Priya's Birthday"
                      : "e.g., Driving practice with Akshay / Family Meeting"
                  }
                  className="domus-input"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#4e433b]">
                    Date <span className="text-terracotta-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="domus-input"
                  />
                </div>

                {eventCategory === "FAMILY" && (
                  <div className="flex items-end pb-1">
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#f3ede4] px-3 py-2 text-xs font-bold text-[#4e433b]">
                      <input
                        type="checkbox"
                        checked={isAllDay}
                        onChange={(e) => setIsAllDay(e.target.checked)}
                        className="h-4 w-4 accent-terracotta-500"
                      />
                      All Day
                    </label>
                  </div>
                )}
              </div>

              {/* Start / End Time */}
              {eventCategory === "FAMILY" && !isAllDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#4e433b]">
                      Start Time <span className="text-terracotta-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={startTimeStr}
                      onChange={(e) => setStartTimeStr(e.target.value)}
                      className="domus-input"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#4e433b]">
                      End Time <span className="text-terracotta-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={endTimeStr}
                      onChange={(e) => setEndTimeStr(e.target.value)}
                      className="domus-input"
                    />
                  </div>
                </div>
              )}

              {/* Who's Involved — ONLY on All House Calendar (never on My Calendar!) */}
              {scope === "ALL" && eventCategory === "FAMILY" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-[#4e433b]">
                      <Users className="h-3.5 w-3.5 text-terracotta-500" />
                      Who&apos;s Involved?
                    </label>
                    <button
                      type="button"
                      onClick={toggleEveryone}
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition ${
                        allSelected
                          ? "bg-[#1f332b] text-white"
                          : "bg-[#f3ede4] text-[#5c5047] hover:bg-[#e5d9ca]"
                      }`}
                    >
                      {allSelected ? "✓ Whole Family" : "Select Whole Family"}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {members.map((m) => {
                      const active = participantIds.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleParticipant(m.id)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold transition ${
                            active
                              ? "border-[#1f332b] bg-[#1f332b] text-white"
                              : "border-transparent bg-[#f3ede4] text-[#5c5047] hover:bg-[#eae0d3]"
                          }`}
                        >
                          <MemberAvatar
                            initials={m.avatarInitials}
                            color={m.color}
                            avatarId={m.avatarId}
                            size="sm"
                          />
                          {m.id === currentMember.id ? `${m.name} (You)` : m.name}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-[#7c6e63]">
                    Shows on the Family Calendar and on every selected
                    person&apos;s Personal Calendar.
                  </p>
                </div>
              )}

              <MiniaturePicker
                value={eventIconId}
                label="2.5D Icon Badge (Optional)"
                compactCount={5}
                onSelect={(mini) =>
                  setEventIconId((prev) => (prev === mini.id ? "" : mini.id))
                }
              />

              <div>
                <label className="mb-1 block text-xs font-bold text-[#4e433b]">
                  Notes / Location (Optional)
                </label>
                <input
                  value={eventNotes}
                  onChange={(e) => setEventNotes(e.target.value)}
                  placeholder="Details, address, or reminder..."
                  className="domus-input"
                />
              </div>

              {formError && (
                <p className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  {formError}
                </p>
              )}

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="domus-btn-secondary flex-1 py-2.5 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="domus-btn-accent flex-1 py-2.5 text-xs"
                >
                  {saving ? "Saving..." : "Save to Calendar"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
