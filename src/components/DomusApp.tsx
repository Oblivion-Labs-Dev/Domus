"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Compass,
  DoorOpen,
  Home,
  LayoutGrid,
  LogOut,
  Palette,
  Shield,
  Users,
} from "lucide-react";
import { GLOBAL_PALETTES, GlobalPaletteId } from "@/lib/palettes";
import { MemberContext, ROLE_META } from "@/lib/rbac";
import CalendarView from "./CalendarView";
import CommonAreaView from "./CommonAreaView";
import FamilyView from "./FamilyView";
import HouseEntryway from "./HouseEntryway";
import HouseTour from "./HouseTour";
import LoginView from "./LoginView";
import MemberAvatar from "./MemberAvatar";
import PersonalRoomView from "./PersonalRoomView";
import { ActiveTab, HouseholdDTO, MemberDTO, RoomKnockDTO } from "./types";

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
  const [activeTab, setActiveTab] = useState<ActiveTab>("entry");
  const [visitingRoomOwnerId, setVisitingRoomOwnerId] = useState<string | null>(
    null
  );
  const [bookMemberId, setBookMemberId] = useState<string | undefined>(
    undefined
  );
  const [knockCount, setKnockCount] = useState(0);
  const [tourOpen, setTourOpen] = useState(false);
  const [palette, setPalette] = useState<GlobalPaletteId>("botanical");
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? (window.localStorage.getItem("domus_palette") as GlobalPaletteId | null)
        : null;
    const initial = saved ?? "botanical";
    setPalette(initial);
    document.documentElement.setAttribute("data-palette", initial);
  }, []);

  function handleSelectPalette(next: GlobalPaletteId) {
    setPalette(next);
    document.documentElement.setAttribute("data-palette", next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("domus_palette", next);
    }
    setPaletteOpen(false);
  }

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
        const kRes = await fetch("/api/rooms/knocks", { cache: "no-store" });
        if (kRes.ok) {
          const kd = await kRes.json();
          const pending = (kd.incoming ?? []).filter(
            (k: RoomKnockDTO) => k.status === "KNOCKING"
          ).length;
          setKnockCount(pending);
        }
      }
    } catch {
      setSession((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  async function handleDemoRoleSwitch(memberId: string) {
    await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demoSwitchMemberId: memberId }),
    });
    setVisitingRoomOwnerId(null);
    await loadSession();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setVisitingRoomOwnerId(null);
    await loadSession();
  }

  function handleNavigate(tab: ActiveTab, preselectBookMemberId?: string) {
    if (tab === "room") {
      setVisitingRoomOwnerId(null);
    }
    setBookMemberId(preselectBookMemberId);
    setActiveTab(tab);
  }

  function handleVisitRoom(memberId: string) {
    setVisitingRoomOwnerId(memberId);
    setActiveTab("room");
  }

  if (session.loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-sm text-stone-500">
        <motion.div
          animate={{ rotate: [0, 8, -8, 0], y: [0, -6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-900 text-white"
          style={{
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.2), 0 5px 0 0 #0b0a08, 0 14px 24px -6px rgba(25,23,20,0.35)",
          }}
        >
          <Home className="h-5 w-5" />
        </motion.div>
        <p className="font-medium">Opening Domus...</p>
      </div>
    );
  }

  if (!session.authenticated || !session.member) {
    return <LoginView onAuthenticated={loadSession} />;
  }

  const currentMember = session.member;

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    {
      id: "common",
      label: "Common Area",
      icon: <LayoutGrid className="h-4 w-4 shrink-0" />,
    },
    {
      id: "room",
      label: "My Room",
      icon: <DoorOpen className="h-4 w-4 shrink-0" />,
      badge: knockCount > 0 ? knockCount : undefined,
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: <Calendar className="h-4 w-4 shrink-0" />,
    },
    {
      id: "family",
      label: "Family & Doors",
      icon: <Users className="h-4 w-4 shrink-0" />,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Guided Interactive 2.5D House Tour */}
      <HouseTour
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        onNavigate={(tab) => handleNavigate(tab)}
      />

      {/* Rich Sculpted 2.5D Header Bar (adapts to active palette!) */}
      <header
        className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-md transition-colors duration-300"
        style={{
          backgroundColor: "var(--domus-header-bg)",
          color: "var(--domus-header-text)",
          boxShadow: "0 4px 0 0 rgba(0,0,0,0.22), 0 14px 32px -12px rgba(0,0,0,0.3)",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {/* Brand (click to return to Entryway Porch) */}
          <button
            onClick={() => handleNavigate("entry")}
            className="flex shrink-0 items-center gap-3 text-left"
          >
            <motion.div
              whileHover={{ y: -2, rotate: -5 }}
              whileTap={{ y: 1, scale: 0.95 }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
              style={{
                backgroundColor: "var(--domus-accent)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.3), 0 3px 0 0 var(--domus-accent-deep)",
              }}
            >
              <Home className="h-4 w-4" />
            </motion.div>
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap text-base font-bold tracking-tight text-white">
                Domus
              </span>
              <span className="hidden whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/90 xl:inline">
                {session.household?.name ?? "Household"}
              </span>
            </div>
          </button>

          {/* Desktop 2.5D Single-Line Spring Pill Nav */}
          <nav className="hidden shrink-0 items-center gap-1 rounded-2xl border border-white/15 bg-black/20 p-1.5 md:flex">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`relative inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                    active
                      ? "text-white"
                      : "text-white/75 hover:text-white"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="domus-nav-pill"
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 32,
                      }}
                      className="absolute inset-0 rounded-xl"
                      style={{
                        backgroundColor: "var(--domus-accent)",
                        boxShadow:
                          "inset 0 1px 0 rgba(255,255,255,0.3), 0 3px 0 0 var(--domus-accent-deep)",
                      }}
                    />
                  )}
                  <span className="relative z-10 inline-flex items-center gap-2 whitespace-nowrap">
                    {item.icon}
                    {item.label}
                    {item.badge && (
                      <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-stone-900">
                        {item.badge}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Palette Picker + Tour + Role Switcher + Avatar + Logout */}
          <div className="relative flex shrink-0 items-center gap-2">
            {/* Live Color Theme Switcher */}
            <div className="relative">
              <button
                onClick={() => setPaletteOpen((v) => !v)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
                title="Change color palette"
              >
                <Palette className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Colors</span>
              </button>
              {paletteOpen && (
                <div className="domus-card absolute right-0 top-11 z-50 w-64 space-y-2 p-3 text-stone-900 shadow-2xl">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    Choose House Color Palette
                  </p>
                  {GLOBAL_PALETTES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPalette(p.id)}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs font-bold transition ${
                        palette === p.id
                          ? "border-terracotta-500 bg-terracotta-50/70"
                          : "border-stone-200 hover:border-stone-400"
                      }`}
                    >
                      <span>{p.name}</span>
                      <span className="flex items-center gap-1">
                        {p.swatches.map((hex, i) => (
                          <span
                            key={i}
                            className="h-3.5 w-3.5 rounded-full border border-black/15"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setTourOpen(true)}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
              title="Launch guided house tour"
            >
              <Compass className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tour</span>
            </button>

            {session.isDemoHouse && session.members.length > 1 && (
              <div className="hidden items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-2.5 py-1.5 lg:flex">
                <Shield className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                <select
                  aria-label="Switch active family member"
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

            <button
              onClick={() => handleNavigate("room")}
              className="flex shrink-0 items-center gap-2 text-left"
              title="Open My Room"
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
              onClick={handleLogout}
              title="Sign out"
              className="inline-flex shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 p-2 text-white transition hover:bg-white/20"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile Nav Strip */}
        <div className="flex gap-1.5 overflow-x-auto border-t border-stone-100 px-3 py-2 md:hidden">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold ${
                  active
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-600"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${currentMember.id}-${visitingRoomOwnerId ?? "own"}`}
            initial={{ opacity: 0, y: 14, scale: 0.992 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.992 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            {activeTab === "entry" && (
              <HouseEntryway
                currentMember={currentMember}
                household={session.household}
                knockCount={knockCount}
                onEnter={(tab) => handleNavigate(tab)}
                onStartTour={() => setTourOpen(true)}
              />
            )}
            {activeTab === "common" && (
              <CommonAreaView
                currentMember={currentMember}
                members={session.members}
                onNavigate={handleNavigate}
              />
            )}
            {activeTab === "room" && (
              <PersonalRoomView
                currentMember={currentMember}
                roomOwnerId={visitingRoomOwnerId ?? currentMember.id}
                members={session.members}
                onReturnToMyRoom={() => setVisitingRoomOwnerId(null)}
                onProfileChanged={loadSession}
              />
            )}
            {activeTab === "calendar" && (
              <CalendarView
                currentMember={currentMember}
                members={session.members}
                initialBookMemberId={bookMemberId}
              />
            )}
            {activeTab === "family" && (
              <FamilyView
                currentMember={currentMember}
                onHouseholdChanged={loadSession}
                onVisitRoom={handleVisitRoom}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
