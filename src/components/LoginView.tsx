"use client";

import { useState } from "react";
import { Home, Lock, Shield, Sparkles, ArrowRight } from "lucide-react";
import { ROLE_META } from "@/lib/rbac";
import type { HouseholdDTO, MemberDTO } from "./types";

interface LoginViewProps {
  household: HouseholdDTO | null;
  demoMembers: MemberDTO[];
  demoSwitcherEnabled: boolean;
  onAuthenticated: () => Promise<void>;
}

export default function LoginView({
  household,
  demoMembers,
  demoSwitcherEnabled,
  onAuthenticated,
}: LoginViewProps) {
  const [email, setEmail] = useState("aarav@domus.local");
  const [password, setPassword] = useState("domus123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      await onAuthenticated();
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickSwitch(memberId: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to enter as member");
        return;
      }
      await onAuthenticated();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-900 text-white shadow-sm">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-stone-900">
                Domus
              </h1>
              <p className="text-xs text-stone-500">
                {household?.name ?? "Family Operating Hub"} · Oblivion Labs
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-600">
            <Shield className="h-3.5 w-3.5 text-terracotta-500" />
            Role-Based Family Permissions
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left column: Value prop + Quick Demo Role Picker */}
          <div className="space-y-6 lg:col-span-7">
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                One calm home for overlapping plans, time-booking, health &amp;
                lists.
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-stone-600">
                Lighter than Notion, built deeper than Google Calendar. Track
                exercise, diet, driving lessons, and yoga alongside shared
                shopping, meal prep, and lawn chores — governed by real family
                roles.
              </p>
            </div>

            {demoSwitcherEnabled && demoMembers.length > 0 && (
              <div className="domus-card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-terracotta-500" />
                    <h3 className="text-sm font-semibold text-stone-900">
                      Instant Demo Sign-In by Household Role
                    </h3>
                  </div>
                  <span className="text-xs text-stone-400">
                    Click any member to test RBAC
                  </span>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  {demoMembers.map((m) => (
                    <button
                      key={m.id}
                      disabled={loading}
                      onClick={() => handleQuickSwitch(m.id)}
                      className="group flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50/70 p-3 text-left transition hover:border-stone-400 hover:bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: m.color }}
                        >
                          {m.avatarInitials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-semibold text-stone-900">
                              {m.name}
                            </span>
                            <span className="rounded-md bg-stone-200/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-700">
                              {ROLE_META[m.role]?.badge ?? m.role}
                            </span>
                          </div>
                          <p className="truncate text-xs text-stone-500">
                            {m.title}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-stone-900" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column: Standard Email / Password Sign-in */}
          <div className="lg:col-span-5">
            <div className="domus-card p-6 sm:p-7">
              <div className="mb-5 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-stone-900">
                    Sign in to your household
                  </h3>
                  <p className="text-xs text-stone-500">
                    Default demo password:{" "}
                    <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-stone-700">
                      domus123
                    </code>
                  </p>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-stone-600">
                    Family Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="aarav@domus.local"
                    className="domus-input"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-stone-600">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="domus-input"
                  />
                </div>

                {error && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="domus-btn-primary w-full py-2.5"
                >
                  {loading ? "Signing in..." : "Enter Domus"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
