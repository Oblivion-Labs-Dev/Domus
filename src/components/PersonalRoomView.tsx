"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BellRing,
  Camera,
  Check,
  DoorClosed,
  DoorOpen,
  Hand,
  Lock,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { ROOM_THEMES } from "@/lib/decor";
import type { MemberContext } from "@/lib/rbac";
import AvatarEditorModal from "./AvatarEditorModal";
import FreeformDecorCanvas from "./FreeformDecorCanvas";
import InteractiveBoard from "./InteractiveBoard";
import MemberAvatar from "./MemberAvatar";
import ProgressRing25D from "./ProgressRing25D";
import SpaceBuilder, {
  AvailableBlockOption,
  normalizeSpaceBlocks,
  SpaceBlockItem,
} from "./SpaceBuilder";
import TiltCard from "./TiltCard";
import type {
  BoardCardDTO,
  BoardColumnDTO,
  BoardDTO,
  HouseResourceDTO,
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
  const [resources, setResources] = useState<HouseResourceDTO[]>([]);
  const [claimedTasks, setClaimedTasks] = useState<
    Array<{
      id: string;
      title: string;
      dueDate: string | null;
      priority: string;
      noteColor: string;
      resourceId: string | null;
    }>
  >([]);
  const [trackers, setTrackers] = useState<TrackerDTO[]>([]);
  const [knocks, setKnocks] = useState<RoomKnockDTO[]>([]);
  const [lockedMessage, setLockedMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);

  // Quick tracker log
  const [logId, setLogId] = useState<string | null>(null);
  const [logVal, setLogVal] = useState("1");
  const [logNote, setLogNote] = useState("");

  // Quick new tracker
  const [showNewTracker, setShowNewTracker] = useState(false);
  const [trkTitle, setTrkTitle] = useState("");
  const [trkType, setTrkType] = useState<"EXERCISE" | "DIET" | "LIFE_PLAN">(
    "EXERCISE"
  );
  const [trkUnit, setTrkUnit] = useState("sessions");
  const [trkTarget, setTrkTarget] = useState(5);

  const isOwnRoom = roomOwnerId === currentMember.id;
  const memberById = new Map(members.map((m) => [m.id, m]));
  const roomOwner = memberById.get(roomOwnerId);

  const loadRoom = useCallback(async () => {
    setLoading(true);
    setLockedMessage(null);
    try {
      const [roomRes, boardRes, resRes, knockRes] = await Promise.all([
        fetch(`/api/rooms?ownerKey=${encodeURIComponent(roomOwnerId)}`),
        fetch(
          `/api/boards?scope=PERSONAL&ownerId=${encodeURIComponent(roomOwnerId)}`
        ),
        fetch("/api/resources"),
        fetch("/api/rooms/knocks"),
      ]);

      if (roomRes.status === 403) {
        const d = await roomRes.json();
        setLockedMessage(
          d.error ??
            "This room is private. Knock on their door in Family & Doors first!"
        );
        return;
      }

      if (roomRes.ok) {
        const d = await roomRes.json();
        setConfig(d.config);
        setClaimedTasks(d.claimedCommonTasks ?? []);
        setTrackers(d.trackers ?? []);
      }
      if (boardRes.ok) {
        const d = await boardRes.json();
        setBoard(d.board);
        setColumns(d.columns ?? []);
        setCards(d.cards ?? []);
      }
      if (resRes.ok) {
        const d = await resRes.json();
        setResources(d.resources ?? []);
      }
      if (knockRes.ok) {
        const d = await knockRes.json();
        setKnocks(d.incoming ?? []);
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

  async function handleTogglePrivacy() {
    if (!config || !isOwnRoom) return;
    await handleSaveConfig({ isPublic: !config.isPublic });
  }

  async function handleSaveConfig(patch: Partial<RoomConfigDTO>) {
    if (!isOwnRoom) return;
    await fetch("/api/rooms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerKey: currentMember.id, ...patch }),
    });
    await loadRoom();
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

  async function handleLogProgress(e: React.FormEvent, trackerId: string) {
    e.preventDefault();
    await fetch("/api/trackers/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackerId,
        date: new Date().toISOString().slice(0, 10),
        value: Number(logVal),
        note: logNote,
      }),
    });
    setLogId(null);
    setLogNote("");
    await loadRoom();
  }

  async function handleAddTracker(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/trackers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: trkTitle,
        type: trkType,
        category: trkType === "LIFE_PLAN" ? "Life Plan" : trkType,
        unit: trkUnit,
        targetValue: Number(trkTarget),
        cadence: "WEEKLY",
        visibility: "FAMILY",
      }),
    });
    setTrkTitle("");
    setShowNewTracker(false);
    await loadRoom();
  }

  if (loading) {
    return (
      <div className="domus-card p-10 text-center text-sm text-stone-500">
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
          alt="Private Door"
          className="mx-auto h-28 w-28 rounded-2xl object-cover shadow-md"
        />
        <h3 className="text-lg font-bold text-stone-900">
          {roomOwner?.name ?? "Member"}&apos;s Door is Closed
        </h3>
        <p className="text-sm text-stone-600">{lockedMessage}</p>
        <button onClick={onReturnToMyRoom} className="domus-btn-primary">
          <ArrowLeft className="h-4 w-4" />
          Back to My Room
        </button>
      </div>
    );
  }

  const theme = ROOM_THEMES[config?.theme ?? "stone"] ?? ROOM_THEMES.stone;
  const DEFAULT_ROOM_BLOCKS: SpaceBlockItem[] = [
    { id: "blk_claimed", type: "claimed", span: 12 },
    { id: "blk_board", type: "board", span: 12 },
    { id: "blk_trackers", type: "trackers", span: 12 },
  ];
  const ROOM_AVAILABLE_BLOCKS: AvailableBlockOption[] = [
    { type: "board", label: "Personal Board", defaultSpan: 12 },
    { type: "trackers", label: "Exercise, Diet & Life Trackers", defaultSpan: 12 },
    { type: "claimed", label: "Picked-Up House Tasks", defaultSpan: 6 },
  ];
  const roomBlocks = normalizeSpaceBlocks(
    config?.layout ?? [],
    DEFAULT_ROOM_BLOCKS
  );
  const pendingKnocks = knocks.filter((k) => k.status === "KNOCKING");
  const allowedVisitors = knocks.filter((k) => k.status === "ALLOWED");

  return (
    <div className="space-y-6">
      {/* Visiting Banner */}
      {!isOwnRoom && (
        <div className="domus-card flex flex-wrap items-center justify-between gap-3 border-sage-300 bg-sage-50/90 px-4 py-3">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-sage-800">
            <Sparkles className="h-4 w-4 text-sage-600" />
            You are visiting <strong>{roomOwner?.name}&apos;s Room</strong>{" "}
            (Read-Only Guest Pass)
          </div>
          <button
            onClick={onReturnToMyRoom}
            className="domus-btn-secondary py-1.5 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to My Room
          </button>
        </div>
      )}

      {/* Avatar Editor Modal (Upload Photo / 2.5D Icon / Emblem) */}
      {isOwnRoom && (
        <AvatarEditorModal
          open={avatarEditorOpen}
          initials={currentMember.avatarInitials}
          color={currentMember.color}
          currentAvatarId={roomOwner?.avatarId}
          onClose={() => setAvatarEditorOpen(false)}
          onSave={handleSaveAvatar}
        />
      )}

      {/* 2.5D Freeform Decoratable Personal Room Header */}
      {config && (
        <FreeformDecorCanvas
          config={config}
          readOnly={!isOwnRoom}
          onSave={handleSaveConfig}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                disabled={!isOwnRoom}
                onClick={() => isOwnRoom && setAvatarEditorOpen(true)}
                title={
                  isOwnRoom
                    ? "Click to change avatar or upload your photo"
                    : roomOwner?.name
                }
                className={`group relative shrink-0 ${
                  isOwnRoom ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <MemberAvatar
                  initials={
                    roomOwner?.avatarInitials ?? currentMember.avatarInitials
                  }
                  color={roomOwner?.color ?? currentMember.color}
                  avatarId={roomOwner?.avatarId}
                  size="lg"
                />
                {isOwnRoom && (
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-stone-900 text-white shadow transition-transform group-hover:scale-110">
                    <Camera className="h-3 w-3" />
                  </span>
                )}
              </button>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {isOwnRoom ? (
                    <button
                      type="button"
                      onClick={handleTogglePrivacy}
                      title="Click to toggle between Private (Knock Required) and Open Door (Public to Family)"
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition hover:scale-[1.02] ${
                        config.isPublic
                          ? "bg-sage-100 text-sage-800 ring-1 ring-sage-300"
                          : "bg-black/10 text-stone-800 hover:bg-black/15"
                      }`}
                    >
                      {config.isPublic ? (
                        <>
                          <DoorOpen className="h-3 w-3 text-sage-700" />
                          Open Door · Public to Family (Click to Lock)
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3" />
                          Private · Knock Required (Click to Open)
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-black/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      {config.isPublic ? (
                        <>
                          <DoorOpen className="h-3 w-3" />
                          Open Door · Public
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3" />
                          Private · Guest Pass
                        </>
                      )}
                    </span>
                  )}
                </div>
                <h2
                  className={`mt-1 text-2xl font-bold tracking-tight sm:text-3xl ${
                    theme.dark ? "text-white" : "text-stone-900"
                  }`}
                >
                  {config.roomTitle}
                </h2>
                <p
                  className={`mt-0.5 text-sm ${
                    theme.dark ? "text-stone-300" : "text-stone-600"
                  }`}
                >
                  {config.bannerQuote ||
                    "Arrange your boards, notes, trackers & drag-anywhere 2.5D decor."}
                </p>
              </div>
            </div>

            {isOwnRoom && allowedVisitors.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {allowedVisitors.map((v) => {
                  const vm = memberById.get(v.visitorId);
                  return (
                    <div
                      key={v.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white/95 px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm"
                    >
                      <span>{vm?.name} has access</span>
                      <button
                        onClick={() => answerKnock(v.id, "REVOKED")}
                        className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-600 hover:bg-red-50 hover:text-red-600"
                      >
                        <DoorClosed className="h-3 w-3" />
                        Close Door
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </FreeformDecorCanvas>
      )}

      {/* Incoming Knocks on Your Door */}
      {isOwnRoom && pendingKnocks.length > 0 && (
        <div className="domus-card border-terracotta-300 bg-terracotta-50/70 p-4">
          <h3 className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-terracotta-700">
            <BellRing className="h-4 w-4" />
            Someone is Knocking on Your Door
          </h3>
          <div className="space-y-2">
            {pendingKnocks.map((knk) => {
              const visitor = memberById.get(knk.visitorId);
              return (
                <div
                  key={knk.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm"
                >
                  <div>
                    <p className="text-xs font-bold text-stone-900">
                      {visitor?.name ?? "Family Member"}
                    </p>
                    <p className="text-xs text-stone-600">“{knk.message}”</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => answerKnock(knk.id, "ALLOWED")}
                      className="domus-btn-accent px-3 py-1.5 text-xs"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Let In
                    </button>
                    <button
                      onClick={() => answerKnock(knk.id, "DECLINED")}
                      className="domus-btn-secondary px-3 py-1.5 text-xs"
                    >
                      <X className="h-3.5 w-3.5" />
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Drag-and-Drop Modular Room Builder (Drag Boards, Trackers, Claimed Tasks & Custom Notes Anywhere!) */}
      <SpaceBuilder
        blocks={roomBlocks}
        availableBlocks={ROOM_AVAILABLE_BLOCKS}
        readOnly={!isOwnRoom}
        onChangeBlocks={(next) => handleSaveConfig({ layout: next })}
        renderBlock={(block) => {
          if (block.type === "claimed") {
            return (
              <div className="domus-card p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Hand className="h-4 w-4 text-terracotta-500" />
                  <h3 className="text-sm font-bold text-stone-900">
                    House Tasks Picked Up from Common Board
                  </h3>
                </div>
                {claimedTasks.length === 0 ? (
                  <p className="rounded-xl bg-stone-50 p-3 text-xs text-stone-500">
                    No claimed house tasks yet — pick up any open task in the
                    Common Area!
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {claimedTasks.map((t) => (
                      <div
                        key={t.id}
                        className="domus-tile flex items-center justify-between gap-2 p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-stone-900">
                            {t.title}
                          </p>
                          <p className="text-[11px] text-stone-500">
                            {t.dueDate
                              ? `Scheduled: ${t.dueDate}`
                              : "Unscheduled (drag onto Calendar!)"}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-md bg-terracotta-100 px-2 py-0.5 text-[10px] font-bold text-terracotta-700">
                          {t.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          if (block.type === "board" && board) {
            return (
              <div className="domus-card p-5">
                <InteractiveBoard
                  board={board}
                  columns={columns}
                  cards={cards}
                  members={members}
                  resources={resources}
                  currentMember={currentMember}
                  readOnly={!isOwnRoom}
                  onRefresh={loadRoom}
                />
              </div>
            );
          }

          if (block.type === "trackers") {
            return (
              <div className="domus-card space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-stone-900">
                      Personal Exercise, Diet &amp; Life Plan Trackers
                    </h3>
                    <p className="text-xs text-stone-500">
                      Workouts, yoga streaks, hydration &amp; driving lesson
                      hours
                    </p>
                  </div>
                  {isOwnRoom && (
                    <button
                      onClick={() => setShowNewTracker((v) => !v)}
                      className="domus-btn-secondary text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Tracker
                    </button>
                  )}
                </div>

                {showNewTracker && isOwnRoom && (
                  <form
                    onSubmit={handleAddTracker}
                    className="grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:grid-cols-4"
                  >
                    <input
                      required
                      value={trkTitle}
                      onChange={(e) => setTrkTitle(e.target.value)}
                      placeholder="Tracker title (e.g., Yoga, Driving)"
                      className="domus-input sm:col-span-2"
                    />
                    <select
                      value={trkType}
                      onChange={(e) =>
                        setTrkType(
                          e.target.value as "EXERCISE" | "DIET" | "LIFE_PLAN"
                        )
                      }
                      className="domus-input"
                    >
                      <option value="EXERCISE">Exercise</option>
                      <option value="DIET">Diet</option>
                      <option value="LIFE_PLAN">Life Plan</option>
                    </select>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        value={trkTarget}
                        onChange={(e) => setTrkTarget(Number(e.target.value))}
                        className="domus-input w-20"
                      />
                      <input
                        value={trkUnit}
                        onChange={(e) => setTrkUnit(e.target.value)}
                        placeholder="unit"
                        className="domus-input flex-1"
                      />
                    </div>
                    <div className="flex justify-end gap-2 sm:col-span-4">
                      <button
                        type="button"
                        onClick={() => setShowNewTracker(false)}
                        className="domus-btn-secondary text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="domus-btn-primary text-xs"
                      >
                        Save Tracker
                      </button>
                    </div>
                  </form>
                )}

                {trackers.length === 0 ? (
                  <p className="rounded-xl bg-stone-50 p-4 text-xs text-stone-500">
                    No personal trackers yet. Click “Add Tracker” to start!
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {trackers.map((trk) => {
                      const pct = Math.min(
                        100,
                        Math.round((trk.currentValue / trk.targetValue) * 100)
                      );
                      return (
                        <TiltCard
                          key={trk.id}
                          maxTilt={5}
                          lift={4}
                          className="flex flex-col justify-between p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                {trk.cadence} · {trk.category}
                              </span>
                              <h4 className="text-sm font-bold text-stone-900">
                                {trk.title}
                              </h4>
                              <p className="mt-1 text-xs font-semibold text-stone-600">
                                {trk.currentValue} / {trk.targetValue}{" "}
                                {trk.unit}
                              </p>
                            </div>
                            <ProgressRing25D
                              percent={pct}
                              color={roomOwner?.color ?? "#3b6e52"}
                              size={50}
                              strokeWidth={5}
                            />
                          </div>

                          {isOwnRoom && (
                            <div className="mt-3 border-t border-stone-100 pt-2.5">
                              {logId === trk.id ? (
                                <form
                                  onSubmit={(e) => handleLogProgress(e, trk.id)}
                                  className="flex gap-1.5"
                                >
                                  <input
                                    type="number"
                                    step="0.5"
                                    min="0.1"
                                    value={logVal}
                                    onChange={(e) => setLogVal(e.target.value)}
                                    className="domus-input w-16 py-1 text-xs"
                                  />
                                  <input
                                    value={logNote}
                                    onChange={(e) => setLogNote(e.target.value)}
                                    placeholder="Note..."
                                    className="domus-input flex-1 py-1 text-xs"
                                  />
                                  <button
                                    type="submit"
                                    className="domus-btn-primary px-2.5 py-1 text-xs"
                                  >
                                    Add
                                  </button>
                                </form>
                              ) : (
                                <motion.button
                                  whileTap={{ scale: 0.96 }}
                                  onClick={() => {
                                    setLogId(trk.id);
                                    setLogVal("1");
                                  }}
                                  className="domus-btn-secondary w-full py-1.5 text-xs"
                                >
                                  + Log {trk.unit}
                                </motion.button>
                              )}
                            </div>
                          )}
                        </TiltCard>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return null;
        }}
      />
    </div>
  );
}
