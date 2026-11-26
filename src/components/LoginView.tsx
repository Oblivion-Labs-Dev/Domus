"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Crown, Home, Lock, Shield, Sparkles } from "lucide-react";
import { ROLE_META } from "@/lib/rbac";
import MemberAvatar from "./MemberAvatar";
import TiltCard from "./TiltCard";
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
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header Bar */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5">
            <motion.div
              whileHover={{ rotate: -6, y: -2 }}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-b from-stone-800 to-stone-900 text-white"
              style={{
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.22), 0 5px 0 0 #0b0a08, 0 14px 26px -8px rgba(25,23,20,0.35)",
              }}
            >
              <Home className="h-5 w-5" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-stone-900">
                Domus
              </h1>
              <p className="text-xs font-medium text-stone-500">
                {household?.name ?? "Digital Home"} · Oblivion Labs
              </p>
            </div>
          </div>

          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700"
            style={{
              boxShadow:
                "inset 0 1px 0 #fff, 0 3px 0 0 rgba(212,206,192,0.85)",
            }}
          >
            <Shield className="h-3.5 w-3.5 text-terracotta-500" />
            Private Rooms · Knock to Visit
          </span>
        </motion.div>

        <div className="grid items-start gap-8 lg:grid-cols-12">
          {/* Left Column: Hero + Custom 2.5D Isometric House Diorama + Role Picker */}
          <div className="space-y-6 lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="space-y-3"
            >
              <h2 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
                A real digital house — shared living room boards &amp; private
                customizable rooms.
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-stone-600">
                Pick up shared house chores, pin colorful sticky notes, reserve
                House Gear like the family car or lawn mower, decorate your own
                room with 2.5D objects, and knock on anyone&apos;s door before
                visiting.
              </p>
            </motion.div>

            {/* Bespoke 2.5D Isometric House Showcase */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 220 }}
            >
              <TiltCard maxTilt={5} lift={4} className="overflow-hidden p-4">
                <div className="grid items-center gap-4 sm:grid-cols-12">
                  <div className="sm:col-span-7">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/house-hero.png"
                      alt="Domus 2.5D Isometric Home"
                      className="h-56 w-full rounded-2xl bg-[#faf9f5] object-cover shadow-inner"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 sm:col-span-5">
                    {[
                      { src: "/assets/board-3d.png", label: "Common Boards" },
                      { src: "/assets/door-3d.png", label: "Knock to Visit" },
                      { src: "/assets/calendar-3d.png", label: "Day/Wk/Yr Cal" },
                      { src: "/assets/decor-plant.png", label: "2.5D Decor" },
                    ].map((tile) => (
                      <motion.div
                        key={tile.label}
                        whileHover={{ y: -3, scale: 1.04 }}
                        className="domus-tile flex flex-col items-center p-2 text-center"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={tile.src}
                          alt={tile.label}
                          className="h-14 w-14 rounded-xl bg-[#faf9f5] object-cover"
                        />
                        <span className="mt-1 text-[10px] font-bold text-stone-700">
                          {tile.label}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </TiltCard>
            </motion.div>

            {demoSwitcherEnabled && demoMembers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
                className="domus-card p-5"
              >
                <div className="mb-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-terracotta-500" />
                    <h3 className="text-sm font-bold text-stone-900">
                      Walk Through the Front Door As...
                    </h3>
                  </div>
                  <span className="text-xs font-medium text-stone-400">
                    Click any family member
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {demoMembers.map((m, idx) => (
                    <motion.button
                      key={m.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + idx * 0.04 }}
                      whileHover={{ y: -3, scale: 1.015 }}
                      whileTap={{ y: 1, scale: 0.985 }}
                      disabled={loading}
                      onClick={() => handleQuickSwitch(m.id)}
                      className="domus-tile group flex items-center justify-between p-3 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <MemberAvatar
                          initials={m.avatarInitials}
                          color={m.color}
                          avatarId={m.avatarId}
                          size="md"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-bold text-stone-900">
                              {m.name}
                            </span>
                            {m.role === "HEAD" && (
                              <Crown className="h-3.5 w-3.5 text-terracotta-500" />
                            )}
                            <span className="rounded-md bg-stone-200/80 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-700">
                              {ROLE_META[m.role]?.badge ?? m.role}
                            </span>
                          </div>
                          <p className="truncate text-xs text-stone-500">
                            {m.title}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-stone-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-stone-900" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column: Sign-In Card */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="lg:sticky lg:top-8 lg:col-span-5"
          >
            <TiltCard maxTilt={5} lift={4} className="p-6 sm:p-7">
              <div className="mb-6 flex items-center gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-800"
                  style={{
                    boxShadow:
                      "inset 0 1px 0 #fff, 0 3px 0 0 rgba(212,206,192,0.9)",
                  }}
                >
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Sign in to your household
                  </h3>
                  <p className="text-xs text-stone-500">
                    Demo password:{" "}
                    <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono font-semibold text-stone-700">
                      domus123
                    </code>
                  </p>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-stone-600">
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
                  <label className="mb-1.5 block text-xs font-semibold text-stone-600">
                    Room Key (Password)
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your Room Key..."
                    className="domus-input"
                  />
                </div>

                {error && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="domus-btn-primary w-full py-2.5"
                >
                  {loading ? "Entering Domus..." : "Enter Household"}
                </button>
              </form>
            </TiltCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
