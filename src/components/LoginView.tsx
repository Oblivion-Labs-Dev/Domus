"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  DoorOpen,
  Home,
  KeyRound,
  Lock,
  Mail,
  PlusCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AVATAR_PRESETS } from "@/lib/avatars";
import MemberAvatar from "./MemberAvatar";
import TiltCard from "./TiltCard";

interface LoginViewProps {
  onAuthenticated: () => Promise<void>;
}

export default function LoginView({ onAuthenticated }: LoginViewProps) {
  const [mode, setMode] = useState<"ENTER" | "CREATE" | "JOIN" | "RECOVER">(
    "ENTER"
  );

  // Enter House (Name + House + Room Key)
  const [houseIdentifier, setHouseIdentifier] = useState("");
  const [memberName, setMemberName] = useState("");
  const [roomKey, setRoomKey] = useState("");

  // Create / Join House
  const [residenceName, setResidenceName] = useState("");
  const [joinHouseKey, setJoinHouseKey] = useState("");
  const [fullName, setFullName] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [newRoomKey, setNewRoomKey] = useState("");
  const [avatarId, setAvatarId] = useState("crown");

  // Recovery
  const [recoverEmail, setRecoverEmail] = useState("");
  const [recoverResult, setRecoverResult] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEnterHouse(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          houseIdentifier,
          memberName,
          roomKey,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not enter residence.");
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
        mode === "CREATE"
          ? {
              mode: "CREATE",
              residenceName,
              name: fullName,
              email: recoveryEmail,
              roomKey: newRoomKey,
              avatarId,
            }
          : {
              mode: "JOIN",
              houseKey: joinHouseKey,
              name: fullName,
              email: recoveryEmail,
              roomKey: newRoomKey,
              avatarId,
            };

      const res = await fetch("/api/auth/house", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not set up your space.");
        return;
      }
      await onAuthenticated();
    } finally {
      setLoading(false);
    }
  }

  async function handleRecover(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setRecoverResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recoverEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Recovery lookup failed.");
        return;
      }
      setRecoverResult(data.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEnterDemo() {
    setDemoLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/demo", { method: "POST" });
      if (res.ok) {
        await onAuthenticated();
      }
    } finally {
      setDemoLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      {/* Soft luminous studio aurora accents */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute right-0 top-1/4 h-[28rem] w-[28rem] rounded-full bg-orange-200/35 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl">
        {/* Clean Minimal Top Bar */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: -5, y: -2 }}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#163029] text-white shadow-md"
              style={{
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 0 0 #0c1c17, 0 12px 24px -8px rgba(22,48,41,0.4)",
              }}
            >
              <Home className="h-5 w-5" />
            </motion.div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-stone-900">
                Domus
              </h1>
              <p className="text-[11px] font-medium text-stone-500">
                Oblivion Labs
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={demoLoading}
            onClick={handleEnterDemo}
            className="domus-btn-secondary py-2 text-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-terracotta-500" />
            {demoLoading ? "Preparing Demo House..." : "Explore Live Demo"}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </motion.header>

        {/* Main 2-Column Hero */}
        <div className="grid items-center gap-10 lg:grid-cols-12">
          {/* Left 7 Cols: Timeless Headline + Uncropped 2.5D House Centerpiece */}
          <div className="space-y-7 lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 }}
              className="space-y-3"
            >
              <h2 className="text-4xl font-bold leading-[1.12] tracking-tight text-[#132a21] sm:text-5xl">
                Build your family&apos;s digital house.
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-stone-600">
                One calm, flexible space to organize life at home — shared when
                you want, private when you need, shaped entirely by the people
                who live in it.
              </p>
            </motion.div>

            {/* Uncropped 2.5D House Centerpiece */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 220 }}
            >
              <TiltCard
                maxTilt={4}
                lift={5}
                glowColor="rgba(217, 83, 47, 0.12)"
                className="overflow-hidden bg-[#faf9f5] p-5 sm:p-7"
              >
                <div className="flex flex-col items-center">
                  {/* Full, uncropped 2.5D isometric house diorama */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/house-hero.png"
                    alt="Domus Digital House"
                    className="max-h-[340px] w-full object-contain drop-shadow-sm"
                  />
                </div>

                {/* Subtle architectural pillars */}
                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-stone-200/70 pt-4 text-center">
                  <div>
                    <p className="text-xs font-bold text-[#132a21]">
                      Common Space
                    </p>
                    <p className="mt-0.5 text-[11px] text-stone-500">
                      For the whole home
                    </p>
                  </div>
                  <div className="border-x border-stone-200/70 px-2">
                    <p className="text-xs font-bold text-[#132a21]">
                      Private Rooms
                    </p>
                    <p className="mt-0.5 text-[11px] text-stone-500">
                      Yours to arrange
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#132a21]">
                      Real Roles
                    </p>
                    <p className="mt-0.5 text-[11px] text-stone-500">
                      Keys &amp; permissions
                    </p>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          </div>

          {/* Right 5 Cols: Clean Production Auth Card (Enter House / Create / Join) */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="lg:col-span-5"
          >
            <TiltCard maxTilt={3} lift={3} className="space-y-5 p-6 sm:p-7">
              {/* Primary 2-way switcher + Join with Key */}
              <div className="grid grid-cols-3 gap-1 rounded-2xl bg-stone-100 p-1 text-xs font-bold">
                {(
                  [
                    ["ENTER", "Enter House"],
                    ["CREATE", "New House"],
                    ["JOIN", "Join w/ Key"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setMode(key);
                      setError(null);
                      setRecoverResult(null);
                    }}
                    className={`rounded-xl py-2 transition ${
                      mode === key
                        ? "bg-[#163029] text-white shadow-sm"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* MODE 1: ENTER EXISTING HOUSE (House Name/Key + Your Name + Room Key) */}
              {mode === "ENTER" && (
                <form onSubmit={handleEnterHouse} className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <DoorOpen className="h-4 w-4 text-terracotta-500" />
                    <h3 className="text-sm font-bold text-stone-900">
                      Step Inside Your Residence
                    </h3>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">
                      House Name or House Key
                    </label>
                    <input
                      required
                      value={houseIdentifier}
                      onChange={(e) => setHouseIdentifier(e.target.value)}
                      placeholder="e.g., The Suryawanshi Residence or DOMUS-4821"
                      className="domus-input"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">
                      Your Name
                    </label>
                    <input
                      required
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      placeholder="e.g., Sumeet"
                      className="domus-input"
                    />
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-xs font-semibold text-stone-600">
                        Room Key (Password)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setMode("RECOVER");
                          setError(null);
                        }}
                        className="text-[11px] font-semibold text-terracotta-600 hover:underline"
                      >
                        Forgot key?
                      </button>
                    </div>
                    <input
                      type="password"
                      required
                      value={roomKey}
                      onChange={(e) => setRoomKey(e.target.value)}
                      placeholder="Enter your private Room Key"
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
                    <Lock className="h-4 w-4" />
                    {loading ? "Unlocking..." : "Enter Residence"}
                  </button>
                </form>
              )}

              {/* MODE 2 & 3: CREATE NEW HOUSE OR JOIN WITH HOUSE KEY */}
              {(mode === "CREATE" || mode === "JOIN") && (
                <form onSubmit={handleCreateOrJoin} className="space-y-3.5">
                  <div className="flex items-center gap-2">
                    {mode === "CREATE" ? (
                      <PlusCircle className="h-4 w-4 text-terracotta-500" />
                    ) : (
                      <KeyRound className="h-4 w-4 text-sage-600" />
                    )}
                    <h3 className="text-sm font-bold text-stone-900">
                      {mode === "CREATE"
                        ? "Create Your Digital House"
                        : "Join a Residence with House Key"}
                    </h3>
                  </div>

                  {mode === "CREATE" ? (
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-stone-600">
                        Name Your Residence
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
                        House Key
                      </label>
                      <input
                        required
                        value={joinHouseKey}
                        onChange={(e) => setJoinHouseKey(e.target.value)}
                        placeholder="e.g., DOMUS-4821"
                        className="domus-input font-mono uppercase"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                        Recovery Email
                      </label>
                      <input
                        type="email"
                        required
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="For key recovery"
                        className="domus-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">
                      Set Your Room Key (Password)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newRoomKey}
                      onChange={(e) => setNewRoomKey(e.target.value)}
                      placeholder="At least 6 characters"
                      className="domus-input"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-stone-600">
                      Choose Your Avatar
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {AVATAR_PRESETS.slice(0, 7).map((av) => (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => setAvatarId(av.id)}
                          className={`rounded-full p-0.5 transition ${
                            avatarId === av.id
                              ? "ring-2 ring-[#163029]"
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
                      : mode === "CREATE"
                        ? "Create House & Mint House Key"
                        : "Join Residence"}
                  </button>
                </form>
              )}

              {/* MODE 4: FORGOT KEY RECOVERY VIA EMAIL */}
              {mode === "RECOVER" && (
                <form onSubmit={handleRecover} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-terracotta-500" />
                    <h3 className="text-sm font-bold text-stone-900">
                      Find Your Residence &amp; Key
                    </h3>
                  </div>
                  <p className="text-xs text-stone-500">
                    Enter the recovery email you used when your profile was
                    created.
                  </p>
                  <input
                    type="email"
                    required
                    value={recoverEmail}
                    onChange={(e) => setRecoverEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="domus-input"
                  />
                  {recoverResult && (
                    <p className="rounded-xl border border-sage-200 bg-sage-50 px-3 py-2 text-xs font-medium text-sage-800">
                      {recoverResult}
                    </p>
                  )}
                  {error && (
                    <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                      {error}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMode("ENTER")}
                      className="domus-btn-secondary flex-1 text-xs"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="domus-btn-primary flex-1 text-xs"
                    >
                      {loading ? "Looking up..." : "Look Up"}
                    </button>
                  </div>
                </form>
              )}

              <div className="flex items-center justify-center gap-1.5 border-t border-stone-100 pt-3 text-[11px] text-stone-400">
                <ShieldCheck className="h-3.5 w-3.5 text-sage-600" />
                <span>Encrypted Room Keys · Signed HTTP-only sessions</span>
              </div>
            </TiltCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
