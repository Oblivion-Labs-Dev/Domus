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
  const [mode, setMode] = useState<"ENTER" | "CREATE" | "RECOVER">("ENTER");

  // Enter House (ONLY House Name/Key + Room Key — key identifies the member automatically!)
  const [houseIdentifier, setHouseIdentifier] = useState("");
  const [roomKey, setRoomKey] = useState("");

  // Create House (you become Head of Household by default)
  const [residenceName, setResidenceName] = useState("");
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

  async function handleCreateHouse(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/house", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "CREATE",
          residenceName,
          name: fullName,
          email: recoveryEmail,
          roomKey: newRoomKey,
          avatarId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create your house.");
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
      {/* Rich architectural ambient lighting */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-[30rem] w-[30rem] rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute right-0 top-1/4 h-[32rem] w-[32rem] rounded-full bg-terracotta-500/18 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
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
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-terracotta-500 text-white shadow-lg"
              style={{
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.32), 0 4px 0 0 #8f3216, 0 12px 24px -8px rgba(217,83,47,0.5)",
              }}
            >
              <Home className="h-5 w-5" />
            </motion.div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-[#f7f4ee]">
                Domus
              </h1>
              <p className="text-[11px] font-medium text-[#9ec0b2]">
                Oblivion Labs
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={demoLoading}
            onClick={handleEnterDemo}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-[#f7f4ee] backdrop-blur-md transition hover:bg-white/20 disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
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
              <h2 className="text-4xl font-bold leading-[1.12] tracking-tight text-[#faf8f3] sm:text-5xl">
                Build your family&apos;s digital house.
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-[#bdd4c9]">
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

          {/* Right 5 Cols: Strictly 2 Ways to Enter (Enter House | Create House) */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="lg:col-span-5"
          >
            <TiltCard maxTilt={3} lift={3} className="space-y-5 p-6 sm:p-7">
              {/* Strictly 2 Tabs */}
              <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-stone-100 p-1.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setMode("ENTER");
                    setError(null);
                    setRecoverResult(null);
                  }}
                  className={`rounded-xl py-2.5 transition ${
                    mode === "ENTER" || mode === "RECOVER"
                      ? "bg-[#163029] text-white shadow-sm"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  Enter House
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("CREATE");
                    setError(null);
                    setRecoverResult(null);
                  }}
                  className={`rounded-xl py-2.5 transition ${
                    mode === "CREATE"
                      ? "bg-[#163029] text-white shadow-sm"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  Create House
                </button>
              </div>

              {/* WAY 1: ENTER HOUSE (ONLY House Name/Key + Room Key) */}
              {mode === "ENTER" && (
                <form onSubmit={handleEnterHouse} className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <DoorOpen className="h-4 w-4 text-terracotta-500" />
                    <div>
                      <h3 className="text-sm font-bold text-stone-900">
                        Unlock Your Residence
                      </h3>
                      <p className="text-[11px] text-stone-500">
                        Your Room Key automatically recognizes who you are.
                      </p>
                    </div>
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
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-xs font-semibold text-stone-600">
                        Your Room Key
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
                      placeholder="Enter your personal key"
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

              {/* WAY 2: CREATE A NEW HOUSE (Head of Household by default) */}
              {mode === "CREATE" && (
                <form onSubmit={handleCreateHouse} className="space-y-3.5">
                  <div className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4 text-terracotta-500" />
                    <div>
                      <h3 className="text-sm font-bold text-stone-900">
                        Create Your Digital House
                      </h3>
                      <p className="text-[11px] text-stone-500">
                        You start as Head of Household and can add family
                        members inside.
                      </p>
                    </div>
                  </div>

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

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-stone-600">
                        Your Name
                      </label>
                      <input
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Head of family name"
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
                        placeholder="If you forget your key"
                        className="domus-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">
                      Set Your Room Key
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
                    <KeyRound className="h-4 w-4" />
                    {loading ? "Creating..." : "Create House"}
                  </button>
                </form>
              )}

              {/* FORGOT KEY RECOVERY */}
              {mode === "RECOVER" && (
                <form onSubmit={handleRecover} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-terracotta-500" />
                    <h3 className="text-sm font-bold text-stone-900">
                      Find Your House &amp; Key
                    </h3>
                  </div>
                  <p className="text-xs text-stone-500">
                    Enter the recovery email saved when your profile was
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
