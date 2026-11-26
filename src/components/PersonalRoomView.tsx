"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BellRing,
  Check,
  DoorClosed,
  Hand,
  Lock,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { ROOM_THEMES } from "@/lib/decor";
import type { MemberContext } from "@/lib/rbac";
import DecorStudio from "./DecorStudio";
import InteractiveBoard from "./InteractiveBoard";
import ProgressRing25D from "./ProgressRing25D";
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
}

export default function PersonalRoomView({
  currentMember,
  roomOwnerId,
  members,
  onReturnToMyRoom,
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

  async function handleSaveConfig(patch: Partial<RoomConfigDTO>) {
    if (!isOwnRoom) return;
    await fetch("/api/rooms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerKey: currentMember.id, ...patch }),
    });
    await loadRoom();
  }

  async function moveSection(sectionKey: string, dir: -1 | 1) {
    if (!config || !isOwnRoom) return;
    const current =
      config.layout.length > 0 ? [...config.layout] : ["board", "trackers"];
    const idx = current.indexOf(sectionKey);
    if (idx < 0) return;
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= current.length) return;
    const temp = current[targetIdx];
    current[targetIdx] = current[idx];
    current[idx] = temp;
    await handleSaveConfig({ layout: current });
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
  const sectionOrder =
    config?.layout && config.layout.length > 0
      ? config.layout
      : ["board", "trackers"];
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

      {/* 2.5D Room Header + Decor Studio */}
      <div
        className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br p-6 ${theme.surfaceClass}`}
        style={{
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.85), 0 4px 0 0 rgba(212,206,192,0.85), 0 18px 36px -16px rgba(25,23,20,0.16)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-white text-base font-bold text-white shadow-md"
              style={{
                backgroundColor: roomOwner?.color ?? currentMember.color,
              }}
            >
              {roomOwner?.avatarInitials ?? currentMember.avatarInitials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-black/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  <Lock className="h-3 w-3" />
                  Private Room · Knock Required
                </span>
              </div>
              <h2
                className={`mt-1 text-2xl font-bold tracking-tight sm:text-3xl ${
                  theme.dark ? "text-white" : "text-stone-900"
                }`}
              >
                {config?.roomTitle ?? `${roomOwner?.name}'s Room`}
              </h2>
              <p
                className={`mt-0.5 text-sm ${
                  theme.dark ? "text-stone-300" : "text-stone-600"
                }`}
              >
                {config?.bannerQuote ||
                  "Arrange your boards, notes, trackers & 2.5D decor however you like."}
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

        {config && (
          <div className="mt-5 border-t border-black/10 pt-4">
            <DecorStudio
              config={config}
              readOnly={!isOwnRoom}
              onSave={handleSaveConfig}
            />
          </div>
        )}
      </div>

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

      {/* Claimed Common House Tasks Strip */}
      {claimedTasks.length > 0 && (
        <div className="domus-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Hand className="h-4 w-4 text-terracotta-500" />
            <h3 className="text-sm font-bold text-stone-900">
              House Tasks Picked Up from the Common Board
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                    {t.dueDate ? `Scheduled: ${t.dueDate}` : "Unscheduled"}
                  </p>
                </div>
                <span className="shrink-0 rounded-md bg-terracotta-100 px-2 py-0.5 text-[10px] font-bold text-terracotta-700">
                  {t.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flexible Reorderable Room Sections */}
      {sectionOrder.map((section, idx) => {
        if (section === "board" && board) {
          return (
            <div key="board" className="domus-card space-y-3 p-5">
              {isOwnRoom && (
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Arrange Room:
                  </span>
                  <button
                    disabled={idx === 0}
                    onClick={() => moveSection("board", -1)}
                    className="rounded-lg border border-stone-200 p-1 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
                    title="Move section up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    disabled={idx === sectionOrder.length - 1}
                    onClick={() => moveSection("board", 1)}
                    className="rounded-lg border border-stone-200 p-1 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
                    title="Move section down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
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

        if (section === "trackers") {
          return (
            <div key="trackers" className="domus-card space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Personal Exercise, Diet &amp; Life Plan Trackers
                  </h3>
                  <p className="text-xs text-stone-500">
                    Your workouts, yoga streaks, hydration, and driving lesson
                    hours
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isOwnRoom && (
                    <>
                      <button
                        onClick={() => setShowNewTracker((v) => !v)}
                        className="domus-btn-secondary text-xs"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Tracker
                      </button>
                      <button
                        disabled={idx === 0}
                        onClick={() => moveSection("trackers", -1)}
                        className="rounded-lg border border-stone-200 p-1 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
                        title="Move section up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        disabled={idx === sectionOrder.length - 1}
                        onClick={() => moveSection("trackers", 1)}
                        className="rounded-lg border border-stone-200 p-1 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
                        title="Move section down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
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
                  <div className="flex justify-end sm:col-span-4">
                    <button type="submit" className="domus-btn-primary text-xs">
                      Save Tracker
                    </button>
                  </div>
                </form>
              )}

              {trackers.length === 0 ? (
                <p className="rounded-xl bg-stone-50 p-4 text-xs text-stone-500">
                  No personal trackers yet. Click “Add Tracker” to start tracking
                  exercise, diet, yoga, or driving hours!
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
                              {trk.currentValue} / {trk.targetValue} {trk.unit}
                            </p>
                          </div>
                          <ProgressRing25D
                            percent={pct}
                            color={roomOwner?.color ?? "#4f7c5b"}
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
      })}
    </div>
  );
}
