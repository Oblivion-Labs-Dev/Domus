"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BellRing,
  CalendarClock,
  Check,
  DoorOpen,
  Wrench,
  X,
} from "lucide-react";
import { ROOM_THEMES } from "@/lib/decor";
import type { MemberContext } from "@/lib/rbac";
import CommonSocialHub from "./CommonSocialHub";
import FreeformDecorCanvas from "./FreeformDecorCanvas";
import InteractiveBoard from "./InteractiveBoard";
import ListsView from "./ListsView";
import TiltCard from "./TiltCard";
import {
  ActiveTab,
  BoardCardDTO,
  BoardColumnDTO,
  BoardDTO,
  formatShortDate,
  HouseResourceDTO,
  MemberDTO,
  RoomConfigDTO,
  RoomKnockDTO,
} from "./types";

interface CommonAreaViewProps {
  currentMember: MemberContext;
  members: MemberDTO[];
  onNavigate: (tab: ActiveTab, preselectBookMemberId?: string) => void;
}

export default function CommonAreaView({
  currentMember,
  members,
  onNavigate,
}: CommonAreaViewProps) {
  const [roomConfig, setRoomConfig] = useState<RoomConfigDTO | null>(null);
  const [board, setBoard] = useState<BoardDTO | null>(null);
  const [columns, setColumns] = useState<BoardColumnDTO[]>([]);
  const [cards, setCards] = useState<BoardCardDTO[]>([]);
  const [resources, setResources] = useState<HouseResourceDTO[]>([]);
  const [incomingKnocks, setIncomingKnocks] = useState<RoomKnockDTO[]>([]);
  const [showLists, setShowLists] = useState(false);

  const memberById = new Map(members.map((m) => [m.id, m]));

  const loadCommon = useCallback(async () => {
    const [roomRes, boardRes, resRes, knockRes] = await Promise.all([
      fetch("/api/rooms?ownerKey=COMMON"),
      fetch("/api/boards?scope=COMMON"),
      fetch("/api/resources"),
      fetch("/api/rooms/knocks"),
    ]);

    if (roomRes.ok) {
      const d = await roomRes.json();
      setRoomConfig(d.config);
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
      setIncomingKnocks(
        (d.incoming ?? []).filter(
          (k: RoomKnockDTO) => k.status === "KNOCKING"
        )
      );
    }
  }, []);

  useEffect(() => {
    loadCommon();
  }, [loadCommon, currentMember.id]);

  async function handleSaveRoomConfig(patch: Partial<RoomConfigDTO>) {
    await fetch("/api/rooms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerKey: "COMMON", ...patch }),
    });
    await loadCommon();
  }

  async function answerKnock(knockId: string, status: "ALLOWED" | "DECLINED") {
    await fetch("/api/rooms/knocks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ knockId, status }),
    });
    await loadCommon();
  }

  const theme =
    ROOM_THEMES[roomConfig?.theme ?? "stone"] ?? ROOM_THEMES.stone;

  return (
    <div className="space-y-6">
      {/* Incoming Door Knocks Banner */}
      {incomingKnocks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="domus-card border-terracotta-300 bg-gradient-to-r from-terracotta-50 to-amber-50/80 p-4"
        >
          <div className="space-y-2.5">
            {incomingKnocks.map((knk) => {
              const visitor = memberById.get(knk.visitorId);
              return (
                <div
                  key={knk.id}
                  className="flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-terracotta-500 text-white shadow-sm">
                      <BellRing className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900">
                        {visitor?.name ?? "Someone"} is knocking on your room
                        door!
                      </p>
                      <p className="text-xs text-stone-600">“{knk.message}”</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                      Not Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* 2.5D Freeform Decoratable Common Living Room Hero */}
      {roomConfig && (
        <FreeformDecorCanvas config={roomConfig} onSave={handleSaveRoomConfig}>
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex items-start gap-4">
              <motion.div
                whileHover={{ y: -4, rotate: -2 }}
                className="hidden h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-[#faf9f5] shadow-md sm:block"
                style={{
                  boxShadow:
                    "0 5px 0 0 rgba(202,187,165,0.85), 0 14px 24px -10px rgba(25,21,18,0.22)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/house-hero.png"
                  alt="Domus Home"
                  className="h-full w-full object-cover"
                />
              </motion.div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-terracotta-600">
                  Common Area · Shared House Wall
                </p>
                <h2
                  className={`mt-1 text-2xl font-bold tracking-tight sm:text-3xl ${
                    theme.dark ? "text-white" : "text-stone-900"
                  }`}
                >
                  {roomConfig.roomTitle}
                </h2>
                <p
                  className={`mt-1 max-w-xl text-sm ${
                    theme.dark ? "text-stone-300" : "text-stone-600"
                  }`}
                >
                  {roomConfig.bannerQuote ||
                    "Pick up unclaimed chores, pin sticky notes, drag tasks across columns, and decorate anywhere on this wall."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => onNavigate("room")}
                className="domus-btn-primary whitespace-nowrap"
              >
                <DoorOpen className="h-4 w-4" />
                Enter My Room
              </button>
              <button
                onClick={() => onNavigate("calendar")}
                className="domus-btn-accent whitespace-nowrap"
              >
                <CalendarClock className="h-4 w-4" />
                Calendar &amp; Booking
              </button>
            </div>
          </div>
        </FreeformDecorCanvas>
      )}

      {/* Shared House Gear Strip (2.5D Tilt Cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-terracotta-500" />
            <h3 className="text-sm font-bold text-stone-900">
              Shared House Gear
            </h3>
            <span className="text-xs text-stone-400">
              Attach gear to any board card or calendar block to prevent double-booking
            </span>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {resources.map((res, idx) => (
            <motion.div
              key={res.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <TiltCard maxTilt={6} lift={4} className="flex items-center gap-3.5 p-3.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={res.iconAsset}
                  alt={res.name}
                  className="h-14 w-14 shrink-0 rounded-xl bg-[#faf9f5] object-cover shadow-sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        res.status === "AVAILABLE"
                          ? "bg-sage-500"
                          : "bg-terracotta-500"
                      }`}
                    />
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide ${
                        res.status === "AVAILABLE"
                          ? "text-sage-600"
                          : "text-terracotta-600"
                      }`}
                    >
                      {res.status === "AVAILABLE" ? "Free Now" : "In Use"}
                    </span>
                  </div>
                  <p className="truncate text-xs font-bold text-stone-900">
                    {res.name}
                  </p>
                  <p className="truncate text-[11px] text-stone-500">
                    {res.currentEventTitle
                      ? res.currentEventTitle
                      : res.nextBooking
                        ? `Next: ${formatShortDate(res.nextBooking.startTime)}`
                        : "Open to reserve"}
                  </p>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Fridge Meal Notes, Group Workouts & House Votes */}
      <CommonSocialHub currentMember={currentMember} members={members} />

      {/* Main Interactive Drag-and-Drop Common House Board */}
      {board && (
        <div className="domus-card p-5">
          <InteractiveBoard
            board={board}
            columns={columns}
            cards={cards}
            members={members}
            resources={resources}
            currentMember={currentMember}
            onRefresh={loadCommon}
          />
        </div>
      )}

      {/* Expandable Common Lists (Shopping, Meal Prep, Chores) */}
      <div className="domus-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              Shared Shopping, Meal Prep &amp; Chore Checklists
            </h3>
            <p className="text-xs text-stone-500">
              Quick check-off lists for groceries, Sunday meal prep, and yard upkeep
            </p>
          </div>
          <button
            onClick={() => setShowLists((v) => !v)}
            className="domus-btn-secondary whitespace-nowrap text-xs"
          >
            {showLists ? "Hide Checklists" : "Open Checklists"}
          </button>
        </div>
        {showLists && (
          <div className="mt-5 border-t border-stone-100 pt-5">
            <ListsView currentMember={currentMember} members={members} />
          </div>
        )}
      </div>
    </div>
  );
}
