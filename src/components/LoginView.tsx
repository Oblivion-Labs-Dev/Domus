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

  // Create House (Head of Household by default)
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
      {/* Dreamy Claymorphic 3D Floating Spheres (NO dots!) */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={{ y: [0, -18, 0], x: [0, 10, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-20 -top-20 h-80 w-80 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, #ffd8c4 0%, #f1a988 65%, #e0835c 100%)",
            boxShadow:
              "inset -16px -18px 36px rgba(176, 68, 30, 0.25), inset 12px 12px 26px rgba(255,255,255,0.7), 0 30px 60px rgba(217, 83, 47, 0.16)",
            opacity: 0.55,
          }}
        />
        <motion.div
          animate={{ y: [0, 20, 0], x: [0, -12, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-24 bottom-8 h-96 w-96 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, #d4eee0 0%, #8fc4a8 65%, #5b9978 100%)",
            boxShadow:
              "inset -18px -20px 40px rgba(32, 74, 54, 0.22), inset 14px 14px 30px rgba(255,255,255,0.7), 0 30px 60px rgba(59, 110, 82, 0.16)",
            opacity: 0.55,
          }}
        />
        <motion.div
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-16 h-44 w-44 -translate-x-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 32% 32%, #fff3d1 0%, #f6d488 70%, #e5b352 100%)",
            boxShadow:
              "inset -10px -12px 24px rgba(180, 120, 20, 0.2), inset 8px 8px 18px rgba(255,255,255,0.8)",
            opacity: 0.48,
          }}
        />
      </div>

      <div className="mx-auto max-w-6xl">
        {/* Clean Claymorphic Top Bar */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5">
            <motion.div
              whileHover={{ rotate: -6, y: -3, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
              style={{
                background: "linear-gradient(145deg, #ec704b 0%, #cf4e2a 100%)",
                boxShadow:
                  "0 12px 22px -6px rgba(217, 83, 47, 0.45), inset 0 2px 4px rgba(255,255,255,0.45), inset 0 -5px 8px rgba(143,44,18,0.4)",
              }}
            >
              <Home className="h-5 w-5" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1e1916]">
                Domus
              </h1>
              <p className="text-[11px] font-semibold text-[#6b5d53]">
                Oblivion Labs
              </p>
            </div>
          </div>

          <motion.button
            type="button"
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            disabled={demoLoading}
            onClick={handleEnterDemo}
            className="domus-btn-secondary py-2.5 text-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-terracotta-500" />
            {demoLoading ? "Opening Demo House..." : "Explore Live Demo"}
            <ArrowRight className="h-3.5 w-3.5" />
          </motion.button>
        </motion.header>

        {/* Main 2-Column Claymorphic Hero */}
        <div className="grid items-center gap-10 lg:grid-cols-12">
          {/* Left 7 Cols: Timeless Headline + Seamless 2.5D House Centerpiece */}
          <div className="space-y-7 lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 }}
              className="space-y-3"
            >
              <h2 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-[#1d1714] sm:text-5xl">
                Build your family&apos;s digital house.
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-[#574c44]">
                One warm, flexible space to organize life at home — shared when
                you want, private when you need, shaped entirely by the people
                who live in it.
              </p>
            </motion.div>

            {/* Seamless Claymorphic 2.5D House Pedestal (ZERO square seam!) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 220 }}
            >
              <TiltCard
                maxTilt={5}
                lift={6}
                glowColor="rgba(224, 93, 56, 0.14)"
                className="overflow-hidden p-6 sm:p-8"
              >
                <div className="flex flex-col items-center">
                  {/* Seamless blend so the 2.5D house floats directly on the clay surface */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/house-hero.png"
                    alt="Domus Digital House"
                    className="max-h-[340px] w-full object-contain mix-blend-multiply"
                  />
                </div>

                {/* 3 Tactile Claymorphic Pillars */}
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[
                    { title: "Common Space", sub: "For the whole home" },
                    { title: "Private Rooms", sub: "Yours to arrange" },
                    { title: "Real Roles", sub: "Keys & permissions" },
                  ].map((item) => (
                    <motion.div
                      key={item.title}
                      whileHover={{ y: -3 }}
                      className="domus-tile px-3 py-3 text-center"
                    >
                      <p className="text-xs font-bold text-[#1e1916]">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#6b5d53]">
                        {item.sub}
                      </p>
                    </motion.div>
                  ))}
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
            <TiltCard
              maxTilt={3.5}
              lift={4}
              className="p-6 sm:p-8"
              contentClassName="space-y-6"
            >
              {/* Strictly 2 Claymorphic Tabs */}
              <div
                className="grid grid-cols-2 gap-1.5 rounded-2xl bg-[#efe7dc] p-1.5 text-xs font-bold"
                style={{
                  boxShadow: "inset 0 3px 6px rgba(74, 52, 38, 0.1)",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMode("ENTER");
                    setError(null);
                    setRecoverResult(null);
                  }}
                  className={`rounded-xl py-2.5 transition-all ${
                    mode === "ENTER" || mode === "RECOVER"
                      ? "bg-[#1f332b] text-white shadow-md"
                      : "text-[#5c5047] hover:text-[#1e1916]"
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
                  className={`rounded-xl py-2.5 transition-all ${
                    mode === "CREATE"
                      ? "bg-[#1f332b] text-white shadow-md"
                      : "text-[#5c5047] hover:text-[#1e1916]"
                  }`}
                >
                  Create House
                </button>
              </div>

              {/* WAY 1: ENTER HOUSE (ONLY House Name/Key + Room Key) */}
              {mode === "ENTER" && (
                <form onSubmit={handleEnterHouse} className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-terracotta-100 text-terracotta-600">
                      <DoorOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1e1916]">
                        Unlock Your Residence
                      </h3>
                      <p className="mt-0.5 text-xs text-[#6b5d53]">
                        Your key automatically recognizes who you are.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#4e433b]">
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
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs font-bold text-[#4e433b]">
                        Your Room Key
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setMode("RECOVER");
                          setError(null);
                        }}
                        className="text-[11px] font-bold text-terracotta-600 hover:underline"
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
                    <p className="rounded-2xl bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="domus-btn-accent w-full py-3"
                  >
                    <Lock className="h-4 w-4" />
                    {loading ? "Unlocking..." : "Enter Residence"}
                  </button>
                </form>
              )}

              {/* WAY 2: CREATE A NEW HOUSE (Head of Household by default) */}
              {mode === "CREATE" && (
                <form onSubmit={handleCreateHouse} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sage-100 text-sage-700">
                      <PlusCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1e1916]">
                        Create Your Digital House
                      </h3>
                      <p className="mt-0.5 text-xs text-[#6b5d53]">
                        You start as Head of Household and invite family inside.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#4e433b]">
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

                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-[#4e433b]">
                        Your Name
                      </label>
                      <input
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Head of family"
                        className="domus-input"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-[#4e433b]">
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
                    <label className="mb-1.5 block text-xs font-bold text-[#4e433b]">
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
                    <label className="mb-2 block text-xs font-bold text-[#4e433b]">
                      Choose Your Avatar
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {AVATAR_PRESETS.slice(0, 7).map((av) => (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => setAvatarId(av.id)}
                          className={`rounded-full p-0.5 transition ${
                            avatarId === av.id
                              ? "ring-2 ring-[#1f332b]"
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
                    <p className="rounded-2xl bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="domus-btn-accent w-full py-3"
                  >
                    <KeyRound className="h-4 w-4" />
                    {loading ? "Creating..." : "Create House"}
                  </button>
                </form>
              )}

              {/* FORGOT KEY RECOVERY */}
              {mode === "RECOVER" && (
                <form onSubmit={handleRecover} className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-4 w-4 text-terracotta-500" />
                    <h3 className="text-sm font-bold text-[#1e1916]">
                      Find Your House &amp; Key
                    </h3>
                  </div>
                  <p className="text-xs leading-relaxed text-[#6b5d53]">
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
                    <p className="rounded-2xl border border-sage-200 bg-sage-50 px-3.5 py-2.5 text-xs font-semibold text-sage-800">
                      {recoverResult}
                    </p>
                  )}
                  {error && (
                    <p className="rounded-2xl bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
                      {error}
                    </p>
                  )}
                  <div className="flex gap-2.5">
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

              <div className="flex items-center justify-center gap-1.5 border-t border-stone-200/70 pt-4 text-[11px] font-medium text-[#7c6e63]">
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
