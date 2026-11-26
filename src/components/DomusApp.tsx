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
  Shield,
  Users,
} from "lucide-react";
import { MemberContext, ROLE_META } from "@/lib/rbac";
import CalendarView from "./CalendarView";
import CommonAreaView from "./CommonAreaView";
import FamilyView from "./FamilyView";
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
  demoSwitcherEnabled: boolean;
}

export default function DomusApp() {
  const [session, setSession] = useState<SessionState>({
    loading: true,
    authenticated: false,
    member: null,
    household: null,
    members: [],
    demoSwitcherEnabled: true,
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>("common");
  const [visitingRoomOwnerId, setVisitingRoomOwnerId] = useState<string | null>(
    null
  );
  const [bookMemberId, setBookMemberId] = useState<string | undefined>(
    undefined
  );
  const [knockCount, setKnockCount] = useState(0);
  const [tourOpen, setTourOpen] = useState(false);

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
        demoSwitcherEnabled: Boolean(data.demoSwitcherEnabled),
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
        if (
          typeof window !== "undefined" &&
          !window.localStorage.getItem("domus_tour_seen")
        ) {
          setTourOpen(true);
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
      body: JSON.stringify({ memberId }),
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
    return (
      <LoginView
        household={session.household}
        demoMembers={session.members}
        demoSwitcherEnabled={session.demoSwitcherEnabled}
        onAuthenticated={loadSession}
      />
    );
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

      {/* Crisp Single-Line 2.5D Sculpted Header */}
      <header
        className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/90 backdrop-blur-md"
        style={{
          boxShadow:
            "0 2px 0 0 rgba(230,226,216,0.75), 0 12px 30px -14px rgba(25,23,20,0.12)",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {/* Brand */}
          <button
            onClick={() => handleNavigate("common")}
            className="flex shrink-0 items-center gap-3 text-left"
          >
            <motion.div
              whileHover={{ y: -2, rotate: -5 }}
              whileTap={{ y: 1, scale: 0.95 }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-stone-800 to-stone-900 text-white"
              style={{
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.22), 0 4px 0 0 #0b0a08, 0 8px 16px -6px rgba(25,23,20,0.35)",
              }}
            >
              <Home className="h-4 w-4" />
            </motion.div>
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap text-base font-bold tracking-tight text-stone-900">
                Domus
              </span>
              <span className="hidden whitespace-nowrap rounded-full border border-stone-200 bg-stone-100/90 px-2.5 py-0.5 text-[11px] font-semibold text-stone-600 xl:inline">
                {session.household?.name ?? "Household"}
              </span>
            </div>
          </button>

          {/* Desktop 2.5D Single-Line Spring Pill Nav */}
          <nav
            className="hidden shrink-0 items-center gap-1 rounded-2xl border border-stone-200/90 bg-stone-100/80 p-1.5 md:flex"
            style={{ boxShadow: "inset 0 2px 4px rgba(25,23,20,0.05)" }}
          >
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`relative inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                    active
                      ? "text-white"
                      : "text-stone-600 hover:text-stone-900"
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
                      className="absolute inset-0 rounded-xl bg-gradient-to-b from-stone-800 to-stone-900"
                      style={{
                        boxShadow:
                          "inset 0 1px 0 rgba(255,255,255,0.2), 0 3px 0 0 #0b0a08, 0 8px 14px -5px rgba(25,23,20,0.35)",
                      }}
                    />
                  )}
                  <span className="relative z-10 inline-flex items-center gap-2 whitespace-nowrap">
                    {item.icon}
                    {item.label}
                    {item.badge && (
                      <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-terracotta-500 px-1 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Tour + Role Switcher + Avatar + Logout */}
          <div className="flex shrink-0 items-center gap-2">
            <motion.button
              whileHover={{ y: -1.5 }}
              whileTap={{ y: 1 }}
              onClick={() => setTourOpen(true)}
              className="domus-btn-secondary shrink-0 whitespace-nowrap px-3 py-1.5 text-xs"
              title="Launch guided house tour"
            >
              <Compass className="h-3.5 w-3.5 text-terracotta-500" />
              <span className="hidden sm:inline">Tour</span>
            </motion.button>

            {session.demoSwitcherEnabled && session.members.length > 1 && (
              <div
                className="hidden items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 lg:flex"
                style={{
                  boxShadow:
                    "inset 0 1px 0 #fff, 0 2px 0 0 rgba(212,206,192,0.85)",
                }}
              >
                <Shield className="h-3.5 w-3.5 shrink-0 text-terracotta-500" />
                <select
                  aria-label="Switch active family member"
                  value={currentMember.id}
                  onChange={(e) => handleDemoRoleSwitch(e.target.value)}
                  className="cursor-pointer bg-transparent text-xs font-semibold text-stone-800 focus:outline-none"
                >
                  {session.members.map((m) => (
                    <option key={m.id} value={m.id}>
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

            <motion.button
              whileHover={{ y: -1.5 }}
              whileTap={{ y: 1 }}
              onClick={handleLogout}
              title="Sign out"
              className="domus-btn-secondary shrink-0 px-2.5 py-2"
            >
              <LogOut className="h-4 w-4" />
            </motion.button>
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
