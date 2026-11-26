"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Check,
  Copy,
  DoorOpen,
  Home,
  KeyRound,
  LogOut,
  Shield,
  X,
} from "lucide-react";
import {
  applyWallPaintToDocument,
  DEFAULT_WALL_PAINT,
  loadWallPaintConfig,
  saveAndApplyWallPaint,
  WallPaintConfig,
} from "@/lib/wallPaint";
import { MemberContext, ROLE_META } from "@/lib/rbac";
import CommonAreaView from "./CommonAreaView";
import LoginView from "./LoginView";
import MemberAvatar from "./MemberAvatar";
import PersonalRoomView from "./PersonalRoomView";
import WallPaintModal from "./WallPaintModal";
import { HouseholdDTO, MemberDTO, RoomKnockDTO } from "./types";

interface SessionState {
  loading: boolean;
  authenticated: boolean;
  member: MemberContext | null;
  household: HouseholdDTO | null;
  members: MemberDTO[];
  isDemoHouse: boolean;
}

export default function DomusApp() {
  const [session, setSession] = useState<SessionState>({
    loading: true,
    authenticated: false,
    member: null,
    household: null,
    members: [],
    isDemoHouse: false,
  });

  // Spatial navigation: directly inside Common Area, or inside a Room (yours or someone you were let into)
  const [inRoomOwnerId, setInRoomOwnerId] = useState<string | null>(null);

  // Live incoming knocks on YOUR door
  const [incomingKnocks, setIncomingKnocks] = useState<RoomKnockDTO[]>([]);
  const [knocksOpen, setKnocksOpen] = useState(false);

  // Wall Paint Studio state (triggered from the 2.5D Paint Bucket inside the Common Room!)
  const [wallConfig, setWallConfig] =
    useState<WallPaintConfig>(DEFAULT_WALL_PAINT);
  const [paintModalOpen, setPaintModalOpen] = useState(false);

  const [copiedHouseKey, setCopiedHouseKey] = useState(false);

  useEffect(() => {
    const loaded = loadWallPaintConfig();
    setWallConfig(loaded);
    applyWallPaintToDocument(loaded);
  }, []);

  function handleUpdateWallPaint(next: WallPaintConfig) {
    setWallConfig(next);
    saveAndApplyWallPaint(next);
  }

  const refreshKnocks = useCallback(async () => {
    try {
      const kRes = await fetch("/api/rooms/knocks", { cache: "no-store" });
      if (kRes.ok) {
        const kd = await kRes.json();
        setIncomingKnocks(kd.incoming ?? []);
      }
    } catch {
      // ignore
    }
  }, []);

  const loadSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      setSession({
        loading: false,
        authenticated: Boolean(data.authenticated && data.member),
        member: data.member ?? null,
        household: data.household ?? null,
        members: data.members ?? [],
        isDemoHouse: Boolean(data.isDemoHouse),
      });

      if (data.authenticated && data.member) {
        await refreshKnocks();
      }
    } catch {
      setSession((prev) => ({ ...prev, loading: false }));
    }
  }, [refreshKnocks]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Poll gently for incoming door knocks every 12s while authenticated
  useEffect(() => {
    if (!session.authenticated) return;
    const timer = setInterval(refreshKnocks, 12000);
    return () => clearInterval(timer);
  }, [session.authenticated, refreshKnocks]);

  async function handleRespondKnock(
    knockId: string,
    status: "ALLOWED" | "DECLINED"
  ) {
    await fetch("/api/rooms/knocks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ knockId, status }),
    });
    await refreshKnocks();
  }

  async function handleDemoRoleSwitch(memberId: string) {
    await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demoSwitchMemberId: memberId }),
    });
    setInRoomOwnerId(null);
    await loadSession();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setInRoomOwnerId(null);
    await loadSession();
  }

  async function handleCopyHeaderKey(e: React.MouseEvent) {
    e.stopPropagation();
    if (!session.household?.houseKey) return;
    try {
      await navigator.clipboard.writeText(session.household.houseKey);
      setCopiedHouseKey(true);
      setTimeout(() => setCopiedHouseKey(false), 2000);
    } catch {
      // ignore
    }
  }

  if (session.loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-sm text-[#5c5047]">
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
          style={{
            background: "linear-gradient(145deg, #ec704b 0%, #cf4e2a 100%)",
            boxShadow:
              "0 12px 22px -6px rgba(217, 83, 47, 0.45), inset 0 2px 4px rgba(255,255,255,0.45)",
          }}
        >
          <Home className="h-5 w-5" />
        </motion.div>
        <p className="font-semibold">Opening Domus...</p>
      </div>
    );
  }

  if (!session.authenticated || !session.member) {
    return <LoginView onAuthenticated={loadSession} />;
  }

  const currentMember = session.member;
  const pendingKnocks = incomingKnocks.filter((k) => k.status === "KNOCKING");
  const memberById = Object.fromEntries(session.members.map((m) => [m.id, m]));

  return (
    <div className="min-h-screen">
      {/* Clean Minimal Spatial Header (NO top nav tabs, NO broken Colors dropdown) */}
      <header
        className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-md transition-colors duration-300"
        style={{
          backgroundColor: "var(--domus-header-bg)",
          color: "var(--domus-header-text)",
          boxShadow: "0 10px 30px -12px rgba(0, 0, 0, 0.28)",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {/* Left: Home Brand + Residence Name + 1-click House Key */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setInRoomOwnerId(null)}
              title="Back to Common Area"
              className="flex shrink-0 items-center gap-2.5 text-left"
            >
              <motion.div
                whileHover={{ y: -2, rotate: -5 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white"
                style={{
                  backgroundColor: "var(--domus-accent)",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.35), 0 4px 10px rgba(0,0,0,0.22)",
                }}
              >
                <Home className="h-4 w-4" />
              </motion.div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold tracking-tight text-white sm:text-base">
                  {session.household?.name ?? "Domus"}
                </p>
                <p className="text-[10px] font-medium text-white/65">
                  {inRoomOwnerId
                    ? inRoomOwnerId === currentMember.id
                      ? "Inside Your Private Room"
                      : `Visiting ${memberById[inRoomOwnerId]?.name ?? "Room"}`
                    : "Common Area"}
                </p>
              </div>
            </button>

            {session.household?.houseKey && (
              <button
                type="button"
                onClick={handleCopyHeaderKey}
                title="Copy House Key to share with family"
                className="hidden items-center gap-1.5 whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-2.5 py-1 font-mono text-[11px] font-bold text-white/90 transition hover:bg-white/20 sm:inline-flex"
              >
                <KeyRound className="h-3 w-3 text-amber-300" />
                {session.household.houseKey}
                {copiedHouseKey ? (
                  <Check className="h-3 w-3 text-emerald-300" />
                ) : (
                  <Copy className="h-3 w-3 opacity-75" />
                )}
              </button>
            )}
          </div>

          {/* Right Controls: Incoming Knocks + Demo Switcher + Avatar + Sign Out */}
          <div className="relative flex shrink-0 items-center gap-2">
            {/* Incoming Knocks Bell (wrapped in absolute container so .domus-card NEVER stretches navbar!) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setKnocksOpen((v) => !v)}
                title="Door knocks on your room"
                className={`relative inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
                  pendingKnocks.length > 0
                    ? "border-amber-300/50 bg-amber-400/20 text-amber-100 hover:bg-amber-400/30"
                    : "border-white/20 bg-white/10 text-white/90 hover:bg-white/20"
                }`}
              >
                <Bell className="h-3.5 w-3.5" />
                {pendingKnocks.length > 0 && (
                  <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-extrabold text-[#1e1916]">
                    {pendingKnocks.length}
                  </span>
                )}
              </button>

              {knocksOpen && (
                <div className="absolute right-0 top-11 z-50 w-80">
                  <div className="domus-card space-y-3 p-4 text-[#1e1916] shadow-2xl">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-[#1e1916]">
                        Knocks on Your Door
                      </p>
                      <button
                        type="button"
                        onClick={() => setKnocksOpen(false)}
                        className="rounded-lg p-1 text-[#6b5d53] hover:bg-black/5"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {pendingKnocks.length === 0 ? (
                      <p className="rounded-2xl bg-[#f3ede4] px-3 py-3 text-xs text-[#6b5d53]">
                        Nobody is knocking on your door right now.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {pendingKnocks.map((k) => {
                          const visitor = memberById[k.visitorId];
                          return (
                            <div
                              key={k.id}
                              className="space-y-2.5 rounded-2xl bg-[#f3ede4] p-3"
                            >
                              <div className="flex items-center gap-2.5">
                                <MemberAvatar
                                  initials={visitor?.avatarInitials ?? "?"}
                                  color={visitor?.color ?? "#d45a33"}
                                  avatarId={visitor?.avatarId}
                                  size="sm"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-[#1e1916]">
                                    {visitor?.name ?? "Family Member"} knocked
                                  </p>
                                  {k.message ? (
                                    <p className="mt-0.5 text-xs text-[#574c44]">
                                      &ldquo;{k.message}&rdquo;
                                    </p>
                                  ) : (
                                    <p className="mt-0.5 text-[11px] italic text-[#7c6e63]">
                                      Knocked quietly (no note)
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRespondKnock(k.id, "ALLOWED")
                                  }
                                  className="domus-btn-accent flex-1 py-1.5 text-xs"
                                >
                                  <DoorOpen className="h-3.5 w-3.5" />
                                  Let In
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRespondKnock(k.id, "DECLINED")
                                  }
                                  className="domus-btn-secondary flex-1 py-1.5 text-xs"
                                >
                                  Not Now
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Demo Member Switcher (only shown inside /api/demo) */}
            {session.isDemoHouse && session.members.length > 1 && (
              <div className="hidden items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-2.5 py-1.5 lg:flex">
                <Shield className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                <select
                  aria-label="Switch active demo family member"
                  value={currentMember.id}
                  onChange={(e) => handleDemoRoleSwitch(e.target.value)}
                  className="cursor-pointer bg-transparent text-xs font-semibold text-white focus:outline-none"
                >
                  {session.members.map((m) => (
                    <option
                      key={m.id}
                      value={m.id}
                      className="text-stone-900"
                    >
                      {m.name} ({ROLE_META[m.role]?.badge ?? m.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quick shortcut into Your Own Room */}
            <button
              type="button"
              onClick={() => setInRoomOwnerId(currentMember.id)}
              className="flex shrink-0 items-center gap-2 text-left"
              title={`Open ${currentMember.name}'s Room`}
            >
              <MemberAvatar
                initials={currentMember.avatarInitials}
                color={currentMember.color}
                avatarId={
                  (currentMember.permissions as Record<string, unknown>)
                    ?.avatarId as string | undefined
                }
                size="md"
              />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              title="Leave House (Sign Out)"
              className="inline-flex shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 p-2 text-white transition hover:bg-white/20"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Spatial Area: Common Area OR Inside a Room */}
      <main className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6 lg:py-5">
        <AnimatePresence mode="wait">
          {inRoomOwnerId ? (
            <motion.div
              key={`room-${inRoomOwnerId}-${currentMember.id}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="space-y-5"
            >
              <button
                type="button"
                onClick={() => setInRoomOwnerId(null)}
                className="domus-btn-secondary text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Common Area
              </button>

              <PersonalRoomView
                currentMember={currentMember}
                roomOwnerId={inRoomOwnerId}
                members={session.members}
                onReturnToMyRoom={() => setInRoomOwnerId(currentMember.id)}
                onProfileChanged={loadSession}
              />
            </motion.div>
          ) : (
            <motion.div
              key={`common-${currentMember.id}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
            >
              <CommonAreaView
                currentMember={currentMember}
                household={session.household}
                members={session.members}
                onEnterRoom={(ownerId) => setInRoomOwnerId(ownerId)}
                onHouseholdChanged={loadSession}
                onKnocksChanged={refreshKnocks}
                onOpenWallPaint={() => setPaintModalOpen(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Wall Paint & Wallpaper Studio Modal (opened by clicking the 2.5D Paint Bucket in the Common Room!) */}
      <WallPaintModal
        open={paintModalOpen}
        config={wallConfig}
        onChange={handleUpdateWallPaint}
        onClose={() => setPaintModalOpen(false)}
      />
    </div>
  );
}
