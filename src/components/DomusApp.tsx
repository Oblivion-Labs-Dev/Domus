"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Calendar,
  Home,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Shield,
  Users,
} from "lucide-react";
import { MemberContext, ROLE_META } from "@/lib/rbac";
import CalendarView from "./CalendarView";
import DashboardView from "./DashboardView";
import FamilyView from "./FamilyView";
import ListsView from "./ListsView";
import LoginView from "./LoginView";
import TrackersView from "./TrackersView";
import { ActiveTab, HouseholdDTO, MemberDTO } from "./types";

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
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [bookMemberId, setBookMemberId] = useState<string | undefined>(
    undefined
  );

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
    await loadSession();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await loadSession();
  }

  function handleNavigate(tab: ActiveTab, preselectBookMemberId?: string) {
    setBookMemberId(preselectBookMemberId);
    setActiveTab(tab);
  }

  if (session.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 text-sm text-stone-500">
        Loading Domus household workspace...
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
  }> = [
    {
      id: "dashboard",
      label: "Home Pulse",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      id: "calendar",
      label: "Common Calendar",
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      id: "trackers",
      label: "Health & Plans",
      icon: <Activity className="h-4 w-4" />,
    },
    {
      id: "lists",
      label: "Lists & Chores",
      icon: <ListChecks className="h-4 w-4" />,
    },
    {
      id: "family",
      label: "Family & Roles",
      icon: <Users className="h-4 w-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Top Navigation Shell */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-white">
              <Home className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold tracking-tight text-stone-900">
                  Domus
                </span>
                <span className="hidden rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600 sm:inline">
                  {session.household?.name ?? "Household"}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop nav tabs */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                    active
                      ? "bg-stone-900 text-white"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Active member + role switcher */}
          <div className="flex items-center gap-2.5">
            {session.demoSwitcherEnabled && session.members.length > 1 && (
              <div className="hidden items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-2.5 py-1.5 lg:flex">
                <Shield className="h-3.5 w-3.5 text-terracotta-500" />
                <select
                  aria-label="Switch active family member"
                  value={currentMember.id}
                  onChange={(e) => handleDemoRoleSwitch(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-stone-800 focus:outline-none"
                >
                  {session.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({ROLE_META[m.role]?.badge ?? m.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: currentMember.color }}
                title={`${currentMember.name} · ${ROLE_META[currentMember.role].label}`}
              >
                {currentMember.avatarInitials}
              </div>
              <div className="hidden text-left xl:block">
                <p className="text-xs font-semibold text-stone-900">
                  {currentMember.name}
                </p>
                <p className="text-[10px] font-medium text-stone-500">
                  {ROLE_META[currentMember.role].label}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign out"
              className="rounded-xl border border-stone-200 p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile nav strip */}
        <div className="flex gap-1 overflow-x-auto border-t border-stone-100 px-3 py-2 md:hidden">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
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
        {activeTab === "dashboard" && (
          <DashboardView
            currentMember={currentMember}
            members={session.members}
            onNavigate={handleNavigate}
          />
        )}
        {activeTab === "calendar" && (
          <CalendarView
            currentMember={currentMember}
            members={session.members}
            initialBookMemberId={bookMemberId}
          />
        )}
        {activeTab === "trackers" && (
          <TrackersView
            currentMember={currentMember}
            members={session.members}
          />
        )}
        {activeTab === "lists" && (
          <ListsView currentMember={currentMember} members={session.members} />
        )}
        {activeTab === "family" && (
          <FamilyView
            currentMember={currentMember}
            onHouseholdChanged={loadSession}
          />
        )}
      </main>
    </div>
  );
}
