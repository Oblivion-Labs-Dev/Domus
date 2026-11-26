"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Award,
  BellRing,
  Calendar as CalendarIcon,
  Camera,
  Check,
  DoorClosed,
  DoorOpen,
  ListTodo,
  Lock,
  Pin,
  Plus,
  StickyNote,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { getMiniatureByIdOrSrc } from "@/lib/miniatures";
import type { MemberContext } from "@/lib/rbac";
import AvatarEditorModal from "./AvatarEditorModal";
import FamilyCalendarPanel from "./FamilyCalendarPanel";
import MemberAvatar from "./MemberAvatar";
import MiniaturePicker from "./MiniaturePicker";
import ProgressRing25D from "./ProgressRing25D";
import type {
  BoardCardDTO,
  BoardColumnDTO,
  BoardDTO,
  CalendarEventDTO,
  HouseholdListDTO,
  MemberDTO,
  RoomConfigDTO,
  RoomKnockDTO,
  TrackerDTO,
} from "./types";

interface PersonalRoomViewProps {
  currentMember: MemberContext;
  roomOwnerId: string;
  members: MemberDTO[];
  onReturnToMyRoom: () => void;
  onProfileChanged?: () => Promise<void>;
}

export default function PersonalRoomView({
  currentMember,
  roomOwnerId,
  members,
  onReturnToMyRoom,
  onProfileChanged,
}: PersonalRoomViewProps) {
  const [config, setConfig] = useState<RoomConfigDTO | null>(null);
  const [board, setBoard] = useState<BoardDTO | null>(null);
  const [columns, setColumns] = useState<BoardColumnDTO[]>([]);
  const [cards, setCards] = useState<BoardCardDTO[]>([]);
  const [trackers, setTrackers] = useState<TrackerDTO[]>([]);
  const [knocks, setKnocks] = useState<RoomKnockDTO[]>([]);
  const [events, setEvents] = useState<CalendarEventDTO[]>([]);
  const [lists, setLists] = useState<HouseholdListDTO[]>([]);
  const [lockedMessage, setLockedMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);

  // Personal Tasks
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [scheduleCard, setScheduleCard] = useState<BoardCardDTO | null>(null);
  const [schedDate, setSchedDate] = useState("");
  const [schedAllDay, setSchedAllDay] = useState(false);
  const [schedStart, setSchedStart] = useState("10:00");
  const [schedEnd, setSchedEnd] = useState("11:00");
  const [schedSaving, setSchedSaving] = useState(false);

  // Private Desk Notepad (pins multiple sticky notes to your Personal Pinboard!)
  const [noteTitle, setNoteTitle] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [noteColor, setNoteColor] = useState<
    "butter" | "cream" | "terracotta" | "sage" | "sky"
  >("butter");
  const [noteSaving, setNoteSaving] = useState(false);

  // Personal Goals / Trackers
  const [showNewTracker, setShowNewTracker] = useState(false);
  const [trkTitle, setTrkTitle] = useState("");
  const [trkType, setTrkType] = useState<"EXERCISE" | "DIET" | "LIFE_PLAN">(
    "EXERCISE"
  );
  const [trkIconId, setTrkIconId] = useState("weights");
  const [trkUnit, setTrkUnit] = useState("sessions");
  const [trkTarget, setTrkTarget] = useState(5);

  // Confetti celebration + removable Earned Badges
  const [confettiGoalTitle, setConfettiGoalTitle] = useState<string | null>(
    null
  );
  const [dismissedBadgeIds, setDismissedBadgeIds] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(
        `domus_dismissed_badges_${roomOwnerId}`
      );
      setDismissedBadgeIds(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      setDismissedBadgeIds([]);
    }
  }, [roomOwnerId]);

  function handleDismissBadge(trackerId: string) {
    setDismissedBadgeIds((prev) => {
      const next = Array.from(new Set([...prev, trackerId]));
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          `domus_dismissed_badges_${roomOwnerId}`,
          JSON.stringify(next)
        );
      }
      return next;
    });
  }

  const isOwnRoom = roomOwnerId === currentMember.id;
  const memberById = new Map(members.map((m) => [m.id, m]));
  const roomOwner = memberById.get(roomOwnerId);

  const loadRoom = useCallback(async () => {
    setLockedMessage(null);
    try {
      const [roomRes, boardRes, knockRes, eventsRes, listsRes] =
        await Promise.all([
          fetch(`/api/rooms?ownerKey=${encodeURIComponent(roomOwnerId)}`, {
            cache: "no-store",
          }),
          fetch(
            `/api/boards?scope=PERSONAL&ownerId=${encodeURIComponent(roomOwnerId)}`,
            { cache: "no-store" }
          ),
          fetch("/api/rooms/knocks", { cache: "no-store" }),
          fetch("/api/calendar/events", { cache: "no-store" }),
          fetch("/api/lists", { cache: "no-store" }),
        ]);

      if (roomRes.status === 403) {
        const d = await roomRes.json();
        setLockedMessage(
          d.error ??
            "This room is locked. Knock on their door from the Common Area first."
        );
        return;
      }

      if (roomRes.ok) {
        const d = await roomRes.json();
        setConfig(d.config);
        setTrackers(d.trackers ?? []);
      }
      if (boardRes.ok) {
        const d = await boardRes.json();
        setBoard(d.board);
        setColumns(d.columns ?? []);
        setCards(d.cards ?? []);
      }
      if (knockRes.ok) {
        const d = await knockRes.json();
        setKnocks(d.incoming ?? []);
      }
      if (eventsRes.ok) {
        const d = await eventsRes.json();
        setEvents(d.events ?? []);
      }
      if (listsRes.ok) {
        const d = await listsRes.json();
        setLists(d.lists ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [roomOwnerId]);

  useEffect(() => {
    loadRoom();
  }, [loadRoom, currentMember.id]);

  async function handleSaveAvatar(avatarId: string) {
    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarId }),
    });
    if (!res.ok) throw new Error("Failed");
    if (onProfileChanged) await onProfileChanged();
    await loadRoom();
  }

  async function handleSetDoorOpen(nextPublic: boolean) {
    if (!config || !isOwnRoom || Boolean(config.isPublic) === nextPublic) return;
    setConfig((prev) => (prev ? { ...prev, isPublic: nextPublic } : prev));
    await fetch("/api/rooms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerKey: currentMember.id,
        isPublic: nextPublic,
      }),
    });
  }

  async function handlePinNote(e: React.FormEvent) {
    e.preventDefault();
    if (!isOwnRoom || !board || !todoCol) return;
    const bodyText = noteDraft.trim();
    const titleText = noteTitle.trim() || bodyText.slice(0, 42);
    if (!titleText) return;

    setNoteSaving(true);
    try {
      const res = await fetch("/api/boards/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boardId: board.id,
          columnId: todoCol.id,
          title: titleText,
          description: noteTitle.trim() ? bodyText : bodyText.length > 42 ? bodyText : "",
          cardType: "NOTE",
          noteColor,
          priority: "LOW",
          syncToCommonCalendar: false,
        }),
      });
      if (res.ok) {
        setNoteTitle("");
        setNoteDraft("");
        await loadRoom();
      }
    } finally {
      setNoteSaving(false);
    }
  }

  async function answerKnock(
    knockId: string,
    status: "ALLOWED" | "DECLINED" | "REVOKED"
  ) {
    await fetch("/api/rooms/knocks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ knockId, status }),
    });
    await loadRoom();
  }

  // Personal Tasks (backed by your Personal Board columns: To Do / Done)
  const todoCol =
    columns.find((c) => !/done/i.test(c.title)) ?? columns[0] ?? null;
  const doneCol =
    columns.find((c) => /done/i.test(c.title)) ??
    columns[columns.length - 1] ??
    null;

  async function handleAddPersonalTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim() || !board || !todoCol) return;
    const res = await fetch("/api/boards/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boardId: board.id,
        columnId: todoCol.id,
        title: newTaskTitle.trim(),
        cardType: "TASK",
        priority: "MEDIUM",
        syncToCommonCalendar: false,
      }),
    });
    if (res.ok) {
      setNewTaskTitle("");
      await loadRoom();
    }
  }

  async function handleToggleTaskDone(card: BoardCardDTO) {
    if (!todoCol || !doneCol) return;
    const isDone = card.columnId === doneCol.id;
    const nextColId = isDone ? todoCol.id : doneCol.id;
    setCards((prev) =>
      prev.map((c) => (c.id === card.id ? { ...c, columnId: nextColId } : c))
    );
    const res = await fetch("/api/boards/cards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: card.id, columnId: nextColId }),
    });
    if (!res.ok) await loadRoom();
  }

  async function handleDeleteTask(cardId: string) {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    const res = await fetch(
      `/api/boards/cards?id=${encodeURIComponent(cardId)}`,
      {
        method: "DELETE",
      }
    );
    if (!res.ok) await loadRoom();
  }

  async function handleSchedulePersonalTask(e: React.FormEvent) {
    e.preventDefault();
    if (!scheduleCard || !schedDate) return;
    setSchedSaving(true);
    try {
      const sStr = schedAllDay ? "00:00" : schedStart;
      const eStr = schedAllDay ? "23:59" : schedEnd;
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: scheduleCard.title,
          category: "PERSONAL",
          startTime: `${schedDate}T${sStr}:00`,
          endTime: `${schedDate}T${eStr}:00`,
          participantIds: [currentMember.id],
          visibility: "PRIVATE",
          isShared: false,
          notes: "Scheduled from My Private Room",
        }),
      });
      if (res.ok) {
        await fetch("/api/boards/cards", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: scheduleCard.id, dueDate: schedDate }),
        });
        setScheduleCard(null);
        await loadRoom();
      }
    } finally {
      setSchedSaving(false);
    }
  }

  async function handleQuickLogTracker(tracker: TrackerDTO) {
    const wasComplete = tracker.currentValue >= tracker.targetValue;
    const willBeComplete = tracker.currentValue + 1 >= tracker.targetValue;

    await fetch("/api/trackers/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackerId: tracker.id,
        date: new Date().toISOString().slice(0, 10),
        value: 1,
        note: "",
      }),
    });

    if (!wasComplete && willBeComplete) {
      // Un-dismiss badge if they re-completed it, and launch confetti!
      setDismissedBadgeIds((prev) => prev.filter((id) => id !== tracker.id));
      setConfettiGoalTitle(tracker.title);
      setTimeout(() => setConfettiGoalTitle(null), 2600);
    }

    await loadRoom();
  }

  async function handleDeleteTracker(trackerId: string) {
    setTrackers((prev) => prev.filter((t) => t.id !== trackerId));
    const res = await fetch(
      `/api/trackers?id=${encodeURIComponent(trackerId)}`,
      { method: "DELETE" }
    );
    if (!res.ok) await loadRoom();
  }

  async function handleAddTracker(e: React.FormEvent) {
    e.preventDefault();
    if (!trkTitle.trim()) return;
    await fetch("/api/trackers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: trkTitle.trim(),
        type: trkType,
        category: trkIconId,
        unit: trkUnit.trim() || "sessions",
        targetValue: Number(trkTarget) || 5,
        cadence: "WEEKLY",
        visibility: "PRIVATE",
      }),
    });
    setTrkTitle("");
    setShowNewTracker(false);
    await loadRoom();
  }

  if (loading) {
    return (
      <div className="domus-card p-10 text-center text-sm text-[#6b5d53]">
        Opening room door...
      </div>
    );
  }

  if (lockedMessage) {
    return (
      <div className="domus-card mx-auto max-w-lg space-y-4 p-8 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/door-3d.png"
          alt="Closed private door"
          className="mx-auto h-28 w-28 object-contain mix-blend-multiply"
        />
        <h2 className="text-xl font-extrabold text-[#1e1916]">
          {roomOwner?.name ?? "This"}&apos;s Door Is Locked
        </h2>
        <p className="text-sm text-[#6b5d53]">{lockedMessage}</p>
        <button
          type="button"
          onClick={onReturnToMyRoom}
          className="domus-btn-primary text-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Go to My Own Room
        </button>
      </div>
    );
  }

  const pendingKnocks = knocks.filter((k) => k.status === "KNOCKING");
  const activeGuests = knocks.filter((k) => k.status === "ALLOWED");
  const isDoorOpen = Boolean(config?.isPublic);
  const taskCards = cards.filter((c) => c.cardType !== "NOTE");
  const noteCards = cards.filter((c) => c.cardType === "NOTE");
  const earnedBadges = trackers.filter(
    (t) =>
      t.currentValue >= t.targetValue && !dismissedBadgeIds.includes(t.id)
  );

  const NOTE_SWATCHES: Array<{
    id: "butter" | "cream" | "terracotta" | "sage" | "sky";
    bg: string;
    border: string;
    dot: string;
  }> = [
    { id: "butter", bg: "bg-[#fef3c7]", border: "border-[#f3dc8a]", dot: "#f59e0b" },
    { id: "cream", bg: "bg-[#fbf7ee]", border: "border-[#e6dcc9]", dot: "#a89882" },
    { id: "terracotta", bg: "bg-[#fde8df]", border: "border-[#f3c5b2]", dot: "#e05d38" },
    { id: "sage", bg: "bg-[#e3f1e8]", border: "border-[#bddbc7]", dot: "#3b6e52" },
    { id: "sky", bg: "bg-[#e3effa]", border: "border-[#bdd5ee]", dot: "#2f6690" },
  ];

  return (
    <div className="relative space-y-4 pb-6">
      {/* CELEBRATORY CONFETTI BURST WHEN A GOAL REACHES 100%! */}
      <AnimatePresence>
        {confettiGoalTitle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
          >
            {Array.from({ length: 36 }).map((_, i) => {
              const colors = [
                "#ef6b45",
                "#fbbf24",
                "#34d399",
                "#38bdf8",
                "#fb7185",
                "#a78bfa",
              ];
              const leftPct = 8 + ((i * 2.5) % 84);
              const drift = (i % 2 === 0 ? 1 : -1) * (25 + (i % 5) * 18);
              return (
                <motion.span
                  key={i}
                  initial={{
                    y: -20,
                    x: 0,
                    rotate: 0,
                    opacity: 1,
                    scale: 0.9,
                  }}
                  animate={{
                    y: "95vh",
                    x: drift,
                    rotate: 360 + (i % 4) * 120,
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: 1.8 + (i % 5) * 0.22,
                    delay: (i % 7) * 0.05,
                    ease: "easeOut",
                  }}
                  className="absolute top-0 h-3 w-2 rounded-sm shadow-sm"
                  style={{
                    left: `${leftPct}%`,
                    backgroundColor: colors[i % colors.length],
                  }}
                />
              );
            })}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 24, scale: 1 }}
              exit={{ opacity: 0, y: -12 }}
              className="mx-auto mt-16 flex w-fit items-center gap-2.5 rounded-full border border-amber-300 bg-[#1f332b] px-5 py-2.5 text-sm font-extrabold text-white shadow-2xl"
            >
              <Award className="h-4 w-4 text-amber-300" />
              Goal Reached: {confettiGoalTitle}! Badge Earned!
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AvatarEditorModal
        open={avatarEditorOpen}
        currentAvatarId={
          (currentMember.permissions as Record<string, unknown>)?.avatarId as
            | string
            | undefined
        }
        initials={currentMember.avatarInitials}
        color={currentMember.color}
        onClose={() => setAvatarEditorOpen(false)}
        onSave={handleSaveAvatar}
      />

      {/* COMPACT TOP ROOM HEADER — Clear Lock / Open Door Control on the Far Right */}
      <section className="domus-card px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left: Editable Avatar + Room Title */}
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <MemberAvatar
                initials={roomOwner?.avatarInitials ?? "RM"}
                color={roomOwner?.color ?? "#d45a33"}
                avatarId={roomOwner?.avatarId}
                size="lg"
              />
              {isOwnRoom && (
                <button
                  type="button"
                  onClick={() => setAvatarEditorOpen(true)}
                  title="Edit your avatar or upload photo"
                  className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#1f332b] text-white shadow transition hover:scale-110"
                >
                  <Camera className="h-3 w-3" />
                </button>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-[#1e1916]">
                  {config?.roomTitle ?? `${roomOwner?.name ?? "My"}'s Room`}
                </h1>
                {!isOwnRoom && (
                  <span className="rounded-full bg-sage-100 px-2.5 py-0.5 text-[10px] font-bold text-sage-800">
                    Visiting
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6b5d53]">
                {isOwnRoom
                  ? isDoorOpen
                    ? "Your door is open — family members can step in anytime."
                    : "Your door is locked — family members must knock before entering."
                  : `You are visiting ${roomOwner?.name}'s room.`}
              </p>
            </div>
          </div>

          {/* Far Right: Unmistakable 2-State Door Lock Switch */}
          <div className="flex items-center gap-2.5">
            {!isOwnRoom ? (
              <button
                type="button"
                onClick={onReturnToMyRoom}
                className="domus-btn-secondary py-2 text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to My Room
              </button>
            ) : (
              <div
                role="group"
                aria-label="Room door lock"
                className="inline-flex items-center gap-1 rounded-2xl bg-[#eae1d5] p-1"
                style={{
                  boxShadow: "inset 0 2px 5px rgba(74, 52, 38, 0.12)",
                }}
              >
                <button
                  type="button"
                  onClick={() => handleSetDoorOpen(false)}
                  aria-pressed={!isDoorOpen}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                    !isDoorOpen
                      ? "bg-[#1f332b] text-white shadow-md"
                      : "text-[#6b5d53] hover:text-[#1e1916]"
                  }`}
                >
                  <Lock className="h-3.5 w-3.5" />
                  Locked
                </button>
                <button
                  type="button"
                  onClick={() => handleSetDoorOpen(true)}
                  aria-pressed={isDoorOpen}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                    isDoorOpen
                      ? "bg-sage-700 text-white shadow-md"
                      : "text-[#6b5d53] hover:text-[#1e1916]"
                  }`}
                >
                  <DoorOpen className="h-3.5 w-3.5" />
                  Open
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Earned Goal Badges Shelf (with 1-click Remove permission for room owner) */}
        {earnedBadges.length > 0 && (
          <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-[#e8dfd3] pt-3">
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-600">
              <Award className="h-3.5 w-3.5" />
              Earned Badges:
            </span>
            {earnedBadges.map((b) => {
              const icon =
                getMiniatureByIdOrSrc(b.category) ??
                getMiniatureByIdOrSrc(b.type);
              return (
                <span
                  key={b.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/80 bg-amber-100/90 px-2.5 py-1 text-[11px] font-extrabold text-amber-950 shadow-sm"
                >
                  {icon && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={icon.src}
                      alt=""
                      className="h-4 w-4 rounded object-contain"
                    />
                  )}
                  🏆 {b.title}
                  {isOwnRoom && (
                    <button
                      type="button"
                      onClick={() => handleDismissBadge(b.id)}
                      title="Remove badge"
                      className="ml-0.5 rounded-full p-0.5 opacity-70 transition hover:bg-black/10 hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        )}

        {/* Incoming Knocks / Active Guests strip (only shows when someone is knocking or inside) */}
        {isOwnRoom && (pendingKnocks.length > 0 || activeGuests.length > 0) && (
          <div className="mt-3.5 flex flex-wrap items-center gap-2.5 border-t border-[#e8dfd3] pt-3">
            {pendingKnocks.map((k) => {
              const visitor = memberById.get(k.visitorId);
              return (
                <div
                  key={k.id}
                  className="flex items-center gap-2.5 rounded-2xl bg-amber-50 px-3 py-1.5 text-xs"
                >
                  <BellRing className="h-3.5 w-3.5 text-amber-600" />
                  <span className="font-bold text-[#1e1916]">
                    {visitor?.name ?? "Family"} knocked
                    {k.message ? `: "${k.message}"` : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => answerKnock(k.id, "ALLOWED")}
                    className="rounded-lg bg-sage-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-sage-700"
                  >
                    Let In
                  </button>
                  <button
                    type="button"
                    onClick={() => answerKnock(k.id, "DECLINED")}
                    className="rounded-lg bg-white px-2 py-1 text-[11px] font-bold text-[#5c5047] hover:bg-stone-100"
                  >
                    Not Now
                  </button>
                </div>
              );
            })}

            {activeGuests.map((g) => {
              const guest = memberById.get(g.visitorId);
              return (
                <div
                  key={g.id}
                  className="flex items-center gap-2 rounded-2xl bg-sage-50 px-3 py-1.5 text-xs"
                >
                  <DoorOpen className="h-3.5 w-3.5 text-sage-700" />
                  <span className="font-bold text-sage-900">
                    {guest?.name} has access
                  </span>
                  <button
                    type="button"
                    onClick={() => answerKnock(g.id, "REVOKED")}
                    className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-0.5 text-[11px] font-bold text-[#5c5047] hover:text-red-600"
                  >
                    <DoorClosed className="h-3 w-3" />
                    Close Door
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SINGLE-VIEWPORT BENTO WORKSPACE: PERSONAL TASKS + SCRATCHPAD + GOALS (LEFT) | PERSONAL CALENDAR (RIGHT) */}
      <div className="grid items-start gap-5 lg:grid-cols-12">
        {/* LEFT 7 COLS */}
        <div className="space-y-4 lg:col-span-7">
          {/* 1. PERSONAL TASKS + PRIVATE DESK NOTEPAD (Side-by-side on sm+) */}
          <div className="grid gap-4 sm:grid-cols-12">
            {/* Personal Tasks (7 cols) */}
            <section className="domus-card flex flex-col justify-between p-4 sm:col-span-7 sm:p-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 text-base font-extrabold text-[#1e1916]">
                      <ListTodo className="h-4 w-4 text-terracotta-500" />
                      Personal Tasks
                    </h2>
                    <p className="text-[11px] text-[#6b5d53]">
                      Private to your room — click the calendar icon to time-block
                      any task.
                    </p>
                  </div>
                </div>

                <div className="max-h-[260px] space-y-1.5 overflow-y-auto pr-1">
                  {taskCards.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-[#dfd4c6] px-3 py-5 text-center text-xs text-[#8a7c71]">
                      No personal tasks yet. Add one below!
                    </p>
                  ) : (
                    taskCards.map((card) => {
                      const isDone = doneCol ? card.columnId === doneCol.id : false;
                      return (
                        <div
                          key={card.id}
                          className={`group flex items-center gap-2 rounded-xl bg-[#f3ede4] px-2.5 py-2 transition ${
                            isDone ? "opacity-60" : ""
                          }`}
                        >
                          <button
                            type="button"
                            disabled={!isOwnRoom}
                            onClick={() => handleToggleTaskDone(card)}
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border-2 transition ${
                              isDone
                                ? "border-sage-600 bg-sage-600 text-white"
                                : "border-[#b8aa9c] bg-white hover:border-terracotta-500"
                            }`}
                          >
                            {isDone && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                          </button>

                          <span
                            className={`min-w-0 flex-1 truncate text-xs font-semibold ${
                              isDone
                                ? "text-[#7c6e63] line-through"
                                : "text-[#1e1916]"
                            }`}
                          >
                            {card.title}
                          </span>

                          {isOwnRoom && (
                            <button
                              type="button"
                              onClick={() => {
                                const today = new Date();
                                const fallback = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                                setScheduleCard(card);
                                setSchedDate(card.dueDate || fallback);
                                setSchedAllDay(false);
                                setSchedStart("10:00");
                                setSchedEnd("11:00");
                              }}
                              title="Schedule on My Calendar"
                              className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-1.5 py-0.5 text-[10px] font-bold transition ${
                                card.dueDate
                                  ? "bg-amber-100 text-amber-900"
                                  : "text-[#8a7c71] hover:bg-white hover:text-[#1e1916]"
                              }`}
                            >
                              <CalendarIcon className="h-3 w-3" />
                              {card.dueDate && (
                                <span>{card.dueDate.slice(5)}</span>
                              )}
                            </button>
                          )}

                          {isOwnRoom && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(card.id)}
                              title="Delete task"
                              className="rounded-md p-0.5 text-[#8a7c71] opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {isOwnRoom && (
                <form
                  onSubmit={handleAddPersonalTask}
                  className="mt-3 flex gap-1.5 border-t border-[#e8dfd3] pt-2.5"
                >
                  <input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Add a personal task..."
                    className="domus-input py-1.5 text-xs"
                  />
                  <button
                    type="submit"
                    disabled={!newTaskTitle.trim()}
                    className="domus-btn-primary shrink-0 px-2.5 py-1.5 text-xs disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </form>
              )}
            </section>

            {/* Private Desk Notepad — Create & Pin Multiple Notes to Your Board */}
            <form
              onSubmit={handlePinNote}
              className="domus-card flex flex-col justify-between p-4 sm:col-span-5 sm:p-5"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="flex items-center gap-1.5 text-base font-extrabold text-[#1e1916]">
                    <StickyNote className="h-4 w-4 text-amber-500" />
                    Desk Notepad
                  </h2>
                  {isOwnRoom && (
                    <div className="flex items-center gap-1">
                      {NOTE_SWATCHES.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setNoteColor(s.id)}
                          aria-label={`${s.id} note color`}
                          className={`h-4 w-4 rounded-full border transition ${
                            noteColor === s.id
                              ? "scale-110 ring-2 ring-[#1f332b]"
                              : "border-black/15 opacity-75 hover:opacity-100"
                          }`}
                          style={{ backgroundColor: s.dot }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <input
                  disabled={!isOwnRoom}
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Note title (optional)..."
                  className="w-full rounded-xl border border-[#e5dacb] bg-[#fdfaf4] px-3 py-1.5 text-xs font-bold text-[#1e1916] placeholder:font-normal placeholder:text-[#9c8e82] focus:border-terracotta-400 focus:outline-none"
                />

                <textarea
                  rows={5}
                  disabled={!isOwnRoom}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Write a note, idea, reminder, or list and pin it to your board below..."
                  className="w-full resize-none rounded-2xl border border-[#e5dacb] bg-[#fdfaf4] p-3 text-xs leading-relaxed text-[#2c2520] placeholder:text-[#9c8e82] focus:border-terracotta-400 focus:outline-none"
                />
              </div>

              {isOwnRoom && (
                <button
                  type="submit"
                  disabled={noteSaving || (!noteTitle.trim() && !noteDraft.trim())}
                  className="domus-btn-accent mt-2.5 w-full py-2 text-xs disabled:opacity-45"
                >
                  <Pin className="h-3.5 w-3.5" />
                  {noteSaving ? "Pinning..." : "Pin Note to Board"}
                </button>
              )}
            </form>
          </div>

          {/* 2. PERSONAL GOALS & HABIT TRACKERS */}
          <section className="domus-card p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 text-base font-extrabold text-[#1e1916]">
                  <Target className="h-4 w-4 text-sage-700" />
                  Personal Goals &amp; Habits
                </h2>
                <p className="text-[11px] text-[#6b5d53]">
                  Track workouts, reading, diet, or personal milestones.
                </p>
              </div>
              {isOwnRoom && (
                <button
                  type="button"
                  onClick={() => setShowNewTracker((v) => !v)}
                  className="domus-btn-secondary py-1.5 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Goal
                </button>
              )}
            </div>

            {showNewTracker && (
              <form
                onSubmit={handleAddTracker}
                className="mb-3.5 grid gap-2.5 rounded-2xl bg-[#f3ede4] p-3.5 sm:grid-cols-12"
              >
                <div className="sm:col-span-4">
                  <label className="mb-1 block text-[10px] font-bold text-[#4e433b]">
                    Goal Title <span className="text-terracotta-500">*</span>
                  </label>
                  <input
                    autoFocus
                    required
                    value={trkTitle}
                    onChange={(e) => setTrkTitle(e.target.value)}
                    placeholder="e.g., Gym Workouts"
                    className="domus-input py-1.5 text-xs"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="mb-1 block text-[10px] font-bold text-[#4e433b]">
                    Type
                  </label>
                  <select
                    value={trkType}
                    onChange={(e) =>
                      setTrkType(
                        e.target.value as "EXERCISE" | "DIET" | "LIFE_PLAN"
                      )
                    }
                    className="domus-input py-1.5 text-xs"
                  >
                    <option value="EXERCISE">Exercise</option>
                    <option value="DIET">Diet</option>
                    <option value="LIFE_PLAN">Life Plan</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[10px] font-bold text-[#4e433b]">
                    Target <span className="text-terracotta-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={trkTarget}
                    onChange={(e) => setTrkTarget(Number(e.target.value))}
                    className="domus-input py-1.5 text-xs"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="mb-1 block text-[10px] font-bold text-[#4e433b]">
                    Unit
                  </label>
                  <input
                    value={trkUnit}
                    onChange={(e) => setTrkUnit(e.target.value)}
                    placeholder="sessions"
                    className="domus-input py-1.5 text-xs"
                  />
                </div>
                <div className="sm:col-span-12">
                  <MiniaturePicker
                    value={trkIconId}
                    label="Pick a 2.5D Icon for this Goal"
                    compactCount={6}
                    onSelect={(mini) => setTrkIconId(mini.id)}
                  />
                </div>
                <div className="flex justify-end gap-2 sm:col-span-12">
                  <button
                    type="button"
                    onClick={() => setShowNewTracker(false)}
                    className="domus-btn-secondary py-1.5 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="domus-btn-accent py-1.5 text-xs"
                  >
                    Save Goal
                  </button>
                </div>
              </form>
            )}

            {trackers.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#dfd4c6] px-3 py-4 text-center text-xs text-[#8a7c71]">
                No personal goals yet — click <strong>New Goal</strong> to start
                tracking habits.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {trackers.map((t) => {
                  const pct = Math.min(
                    100,
                    Math.round((t.currentValue / Math.max(1, t.targetValue)) * 100)
                  );
                  const goalIcon =
                    getMiniatureByIdOrSrc(t.category) ??
                    getMiniatureByIdOrSrc(t.type);
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-[#f3ede4] p-3"
                    >
                      <div className="flex items-center gap-2.5">
                        {goalIcon && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={goalIcon.src}
                            alt={goalIcon.label}
                            className="h-9 w-9 shrink-0 object-contain mix-blend-multiply"
                          />
                        )}
                        <ProgressRing25D
                          percent={pct}
                          size={44}
                          color={
                            t.type === "EXERCISE"
                              ? "#d45a33"
                              : t.type === "DIET"
                              ? "#3b6e52"
                              : "#365578"
                          }
                        />
                        <div>
                          <p className="text-xs font-extrabold text-[#1e1916]">
                            {t.title}
                          </p>
                          <p className="text-[11px] text-[#6b5d53]">
                            {t.currentValue} / {t.targetValue} {t.unit}
                          </p>
                        </div>
                      </div>
                      {isOwnRoom && (
                        <div className="flex shrink-0 items-center gap-1">
                          {pct >= 100 ? (
                            <span className="inline-flex items-center gap-1 rounded-xl bg-amber-100 px-2 py-1 text-[10px] font-extrabold text-amber-900">
                              🏆 Done
                            </span>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => handleQuickLogTracker(t)}
                            className="domus-btn-secondary px-2.5 py-1.5 text-xs"
                            title="Log +1"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTracker(t.id)}
                            title="Delete goal"
                            className="rounded-lg p-1 text-[#8a7c71] transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT 5 COLS: PERSONAL MULTI-VIEW CALENDAR (Month | Week | Day) */}
        <FamilyCalendarPanel
          currentMember={currentMember}
          members={members}
          events={events}
          lists={lists}
          onRefresh={loadRoom}
          personalOnly
          ownerName={isOwnRoom ? undefined : roomOwner?.name}
        />
      </div>

      {/* PERSONAL PINBOARD — Sticky Notes pinned from Desk Notepad */}
      <section className="domus-card p-5">
        <div className="mb-3.5 flex items-center justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 text-base font-extrabold text-[#1e1916]">
              <Pin className="h-4 w-4 text-terracotta-500" />
              Pinned Notes Board
            </h2>
            <p className="text-[11px] text-[#6b5d53]">
              Every note you save from your Desk Notepad gets pinned here.
            </p>
          </div>
          <span className="rounded-full bg-[#f3ede4] px-2.5 py-0.5 text-[11px] font-bold text-[#5c5047]">
            {noteCards.length} {noteCards.length === 1 ? "note" : "notes"}
          </span>
        </div>

        {noteCards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#dfd4c6] px-4 py-6 text-center text-xs text-[#8a7c71]">
            Your pinboard is clear — write anything in the{" "}
            <strong>Desk Notepad</strong> above and click{" "}
            <strong>Pin Note to Board</strong>.
          </div>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {noteCards.map((note, idx) => {
              const style =
                NOTE_SWATCHES.find((s) => s.id === note.noteColor) ??
                NOTE_SWATCHES[0];
              return (
                <div
                  key={note.id}
                  className={`group relative rounded-2xl border p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${style.bg} ${style.border}`}
                  style={{
                    transform:
                      idx % 2 === 0 ? "rotate(-0.4deg)" : "rotate(0.4deg)",
                  }}
                >
                  {/* Little clay pin dot */}
                  <span
                    className="absolute left-1/2 top-2 h-2.5 w-2.5 -translate-x-1/2 rounded-full shadow-sm"
                    style={{ backgroundColor: style.dot }}
                  />

                  {isOwnRoom && (
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(note.id)}
                      title="Unpin note"
                      className="absolute right-2.5 top-2.5 rounded-lg p-1 text-[#7c6e63] opacity-0 transition hover:bg-black/5 hover:text-red-600 group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}

                  <div className="mt-2 space-y-1.5">
                    <h3 className="pr-5 text-xs font-extrabold text-[#1e1916]">
                      {note.title}
                    </h3>
                    {note.description && (
                      <p className="whitespace-pre-wrap text-xs leading-relaxed text-[#4e433b]">
                        {note.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SCHEDULE PERSONAL TASK MODAL */}
      <AnimatePresence>
        {scheduleCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setScheduleCard(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d1714]/40 p-4 backdrop-blur-md"
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleSchedulePersonalTask}
              className="domus-card relative w-full max-w-sm space-y-4 p-6"
            >
              <button
                type="button"
                onClick={() => setScheduleCard(null)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#efe7dc] text-[#5c5047] hover:bg-[#e5d9ca]"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="pr-8">
                <p className="text-[10px] font-bold uppercase tracking-wider text-terracotta-600">
                  Add to My Personal Calendar
                </p>
                <h3 className="mt-0.5 text-base font-extrabold text-[#1e1916]">
                  {scheduleCard.title}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#4e433b]">
                    Date <span className="text-terracotta-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={schedDate}
                    onChange={(e) => setSchedDate(e.target.value)}
                    className="domus-input"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#f3ede4] px-3 py-2 text-xs font-bold text-[#4e433b]">
                    <input
                      type="checkbox"
                      checked={schedAllDay}
                      onChange={(e) => setSchedAllDay(e.target.checked)}
                      className="h-4 w-4 accent-terracotta-500"
                    />
                    All Day
                  </label>
                </div>
              </div>

              {!schedAllDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#4e433b]">
                      Start <span className="text-terracotta-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={schedStart}
                      onChange={(e) => setSchedStart(e.target.value)}
                      className="domus-input"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#4e433b]">
                      End <span className="text-terracotta-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={schedEnd}
                      onChange={(e) => setSchedEnd(e.target.value)}
                      className="domus-input"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setScheduleCard(null)}
                  className="domus-btn-secondary flex-1 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schedSaving}
                  className="domus-btn-accent flex-1 py-2 text-xs"
                >
                  {schedSaving ? "Saving..." : "Schedule"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
