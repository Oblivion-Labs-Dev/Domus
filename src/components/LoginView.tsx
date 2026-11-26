"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Crown,
  Home,
  KeyRound,
  Lock,
  PlusCircle,
  Shield,
  Sparkles,
} from "lucide-react";
import { AVATAR_PRESETS } from "@/lib/avatars";
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
  const [authTab, setAuthTab] = useState<"SIGN_IN" | "CREATE_HOUSE" | "JOIN">(
    "SIGN_IN"
  );
  const [email, setEmail] = useState("aarav@domus.local");
  const [password, setPassword] = useState("domus123");

  // Create / Join state
  const [residenceName, setResidenceName] = useState("");
  const [houseKey, setHouseKey] = useState("DOMUS-HOME");
  const [fullName, setFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [roomKey, setRoomKey] = useState("");
  const [avatarId, setAvatarId] = useState("crown");

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

  async function handleCreateOrJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload =
        authTab === "CREATE_HOUSE"
          ? {
              mode: "CREATE",
              residenceName,
              name: fullName,
              email: newEmail,
              roomKey,
              avatarId,
            }
          : {
              mode: "JOIN",
              houseKey,
              name: fullName,
              email: newEmail,
              roomKey,
              avatarId,
            };

      const res = await fetch("/api/auth/house", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not enter house");
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
                  "inset 0 1px 0 rgba(255,255,255,0.22), 0 5px 0 0 #0b0a08, 0 14px 26px -8px rgba(25,21,18,0.35)",
              }}
            >
              <Home className="h-5 w-5" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-stone-900">
                Domus
              </h1>
              <p className="text-xs font-medium text-stone-500">
                Your Digital Residence · Oblivion Labs
              </p>
            </div>
          </div>

          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700"
            style={{
              boxShadow:
                "inset 0 1px 0 #fff, 0 3px 0 0 rgba(202,187,165,0.85)",
            }}
          >
            <Shield className="h-3.5 w-3.5 text-terracotta-500" />
            Create a House or Join with a House Key
          </span>
        </motion.div>

        <div className="grid items-start gap-8 lg:grid-cols-12">
          {/* Left Column: Hero + 2.5D Diorama + Quick Demo Entry */}
          <div className="space-y-6 lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="space-y-3"
            >
              <h2 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
                Build your family&apos;s digital house — shared boards, fridge
                meals, group workouts &amp; private rooms.
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-stone-600">
                Start a brand-new residence as Head of Household, or join your
                family&apos;s house using their House Key.
              </p>
            </motion.div>

            {/* Bespoke 2.5D Isometric House Showcase */}
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
                    { src: "/assets/decor-salad.png", label: "Fridge Meals" },
                    { src: "/assets/decor-weights.png", label: "Group Gym" },
                    { src: "/assets/door-3d.png", label: "Private Rooms" },
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

            {demoSwitcherEnabled && demoMembers.length > 0 && (
              <div className="domus-card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-terracotta-500" />
                    <h3 className="text-sm font-bold text-stone-900">
                      Quick Enter: {household?.name ?? "Starter House"}
                    </h3>
                  </div>
                  <span className="text-xs font-medium text-stone-400">
                    Or create your own house →
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {demoMembers.map((m) => (
                    <motion.button
                      key={m.id}
                      whileHover={{ y: -3, scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={loading}
                      onClick={() => handleQuickSwitch(m.id)}
                      className="domus-tile group flex items-center justify-between p-2.5 text-left"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <MemberAvatar
                          initials={m.avatarInitials}
                          color={m.color}
                          avatarId={m.avatarId}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="truncate text-xs font-bold text-stone-900">
                              {m.name}
                            </span>
                            {m.role === "HEAD" && (
                              <Crown className="h-3 w-3 shrink-0 text-terracotta-500" />
                            )}
                          </div>
                          <p className="truncate text-[10px] text-stone-500">
                            {ROLE_META[m.role]?.badge ?? m.role}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-stone-400 group-hover:translate-x-0.5 group-hover:text-stone-900" />
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sign In / Create New House / Join with House Key */}
          <div className="lg:sticky lg:top-8 lg:col-span-5">
            <TiltCard maxTilt={4} lift={3} className="space-y-5 p-6">
              {/* Mode Switcher */}
              <div className="grid grid-cols-3 gap-1 rounded-2xl bg-stone-100 p-1 text-xs font-bold">
                {(
                  [
                    ["SIGN_IN", "Sign In"],
                    ["CREATE_HOUSE", "New House"],
                    ["JOIN", "Join w/ Key"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setAuthTab(key);
                      setError(null);
                    }}
                    className={`rounded-xl py-2 transition ${
                      authTab === key
                        ? "bg-stone-900 text-white shadow-sm"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {authTab === "SIGN_IN" ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <Lock className="h-4 w-4 text-terracotta-500" />
                    <h3 className="text-sm font-bold text-stone-900">
                      Unlock Your Room
                    </h3>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">
                      Family Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="domus-input"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">
                      Room Key (Password)
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
                    <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="domus-btn-primary w-full py-2.5"
                  >
                    {loading ? "Entering..." : "Enter Residence"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCreateOrJoin} className="space-y-3.5">
                  <div className="flex items-center gap-2">
                    {authTab === "CREATE_HOUSE" ? (
                      <PlusCircle className="h-4 w-4 text-terracotta-500" />
                    ) : (
                      <KeyRound className="h-4 w-4 text-sage-600" />
                    )}
                    <h3 className="text-sm font-bold text-stone-900">
                      {authTab === "CREATE_HOUSE"
                        ? "Name Your New Residence (Head of Family)"
                        : "Join a Family House with House Key"}
                    </h3>
                  </div>

                  {authTab === "CREATE_HOUSE" ? (
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-stone-600">
                        Residence Name
                      </label>
                      <input
                        required
                        value={residenceName}
                        onChange={(e) => setResidenceName(e.target.value)}
                        placeholder="e.g., The Suryawanshi Residence"
                        className="domus-input"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-stone-600">
                        🏠 House Key
                      </label>
                      <input
                        required
                        value={houseKey}
                        onChange={(e) => setHouseKey(e.target.value)}
                        placeholder="e.g., DOMUS-HOME"
                        className="domus-input font-mono uppercase"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-stone-600">
                        Your Name
                      </label>
                      <input
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your name"
                        className="domus-input"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-stone-600">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="you@home.local"
                        className="domus-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">
                      🔑 Set Your Room Key (Password)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={4}
                      value={roomKey}
                      onChange={(e) => setRoomKey(e.target.value)}
                      placeholder="Choose your private room key..."
                      className="domus-input"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-stone-600">
                      Pick Your Avatar
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {AVATAR_PRESETS.slice(0, 6).map((av) => (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => setAvatarId(av.id)}
                          className={`rounded-full p-0.5 transition ${
                            avatarId === av.id
                              ? "ring-2 ring-stone-900"
                              : "opacity-75 hover:opacity-100"
                          }`}
                        >
                          <MemberAvatar
                            initials={av.label.slice(0, 2)}
                            color={av.ring}
                            avatarId={av.id}
                            size="sm"
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="domus-btn-accent w-full py-2.5"
                  >
                    {loading
                      ? "Setting up..."
                      : authTab === "CREATE_HOUSE"
                        ? "Create House & Mint House Key"
                        : "Unlock & Join Residence"}
                  </button>
                </form>
              )}
            </TiltCard>
          </div>
        </div>
      </div>
    </div>
  );
}
