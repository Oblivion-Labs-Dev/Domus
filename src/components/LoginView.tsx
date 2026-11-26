"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  X,
} from "lucide-react";
import { AVATAR_PRESETS } from "@/lib/avatars";
import MemberAvatar from "./MemberAvatar";

interface LoginViewProps {
  onAuthenticated: () => Promise<void>;
}

export default function LoginView({ onAuthenticated }: LoginViewProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"ENTER" | "CREATE" | "RECOVER">("ENTER");

  // Interactive 3D tilt for the floating house diorama
  const houseRef = useRef<HTMLDivElement>(null);
  const [houseTilt, setHouseTilt] = useState({ rotateX: 0, rotateY: 0 });

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

  function openModal(initialMode: "ENTER" | "CREATE") {
    setMode(initialMode);
    setError(null);
    setRecoverResult(null);
    setModalOpen(true);
  }

  useEffect(() => {
    if (!modalOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setModalOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  function handleHouseMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = houseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setHouseTilt({
      rotateY: (px - 0.5) * 14,
      rotateX: (0.5 - py) * 12,
    });
  }

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
    <div className="relative flex min-h-screen flex-col overflow-hidden px-5 py-7 sm:px-8 lg:px-12">
      {/* Warm Claymorphic 3D Floating Background Spheres */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          animate={{ y: [0, -18, 0], x: [0, 10, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-24 -top-24 h-80 w-80 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, #ffd8c4 0%, #f1a988 65%, #e0835c 100%)",
            boxShadow:
              "inset -16px -18px 36px rgba(176, 68, 30, 0.25), inset 12px 12px 26px rgba(255,255,255,0.7), 0 30px 60px rgba(217, 83, 47, 0.16)",
            opacity: 0.5,
          }}
        />
        <motion.div
          animate={{ y: [0, 20, 0], x: [0, -12, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-24 bottom-4 h-96 w-96 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, #d4eee0 0%, #8fc4a8 65%, #5b9978 100%)",
            boxShadow:
              "inset -18px -20px 40px rgba(32, 74, 54, 0.22), inset 14px 14px 30px rgba(255,255,255,0.7), 0 30px 60px rgba(59, 110, 82, 0.16)",
            opacity: 0.5,
          }}
        />
        <motion.div
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[46%] top-12 h-40 w-40 -translate-x-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 32% 32%, #fff3d1 0%, #f6d488 70%, #e5b352 100%)",
            boxShadow:
              "inset -10px -12px 24px rgba(180, 120, 20, 0.2), inset 8px 8px 18px rgba(255,255,255,0.8)",
            opacity: 0.42,
          }}
        />
      </div>

      {/* Top Navigation */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4"
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

        <div className="flex items-center gap-3">
          <motion.button
            type="button"
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            disabled={demoLoading}
            onClick={handleEnterDemo}
            className="domus-btn-secondary py-2.5 text-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-terracotta-500" />
            {demoLoading ? "Opening Demo..." : "Explore Live Demo"}
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => openModal("ENTER")}
            className="domus-btn-primary py-2.5 text-xs"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Enter House
          </motion.button>
        </div>
      </motion.header>

      {/* Main Split Hero: Left Story & CTAs | Right Borderless Floating 3D House */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center py-10 lg:py-14">
        <div className="grid w-full items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Left Column: Headline, Description, Primary CTAs, Pillars */}
          <div className="space-y-8 lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="space-y-4"
            >
              <h2 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-[#1d1714] sm:text-5xl lg:text-[3.4rem]">
                Build your family&apos;s digital house.
              </h2>
              <p className="max-w-lg text-base leading-relaxed text-[#574c44] sm:text-lg">
                One warm, flexible space to organize life at home — shared when
                you want, private when you need, shaped entirely by the people
                who live in it.
              </p>
            </motion.div>

            {/* Primary Entry Actions (Pop up the claymorphic Entry Modal) */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="flex flex-wrap items-center gap-3.5"
            >
              <motion.button
                type="button"
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => openModal("ENTER")}
                className="domus-btn-accent px-7 py-3.5 text-sm"
              >
                <DoorOpen className="h-4 w-4" />
                Enter House
                <ArrowRight className="h-4 w-4" />
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => openModal("CREATE")}
                className="domus-btn-secondary px-7 py-3.5 text-sm"
              >
                <PlusCircle className="h-4 w-4 text-sage-700" />
                Create House
              </motion.button>
            </motion.div>

            {/* 3 Tactile Claymorphic Pillars */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="grid max-w-lg grid-cols-3 gap-3.5 pt-2"
            >
              {[
                { title: "Common Space", sub: "For the whole home" },
                { title: "Private Rooms", sub: "Yours to arrange" },
                { title: "Real Roles", sub: "Keys & permissions" },
              ].map((item) => (
                <motion.div
                  key={item.title}
                  whileHover={{ y: -4 }}
                  className="domus-tile px-3.5 py-3.5 text-left"
                >
                  <p className="text-xs font-bold text-[#1e1916]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-[#6b5d53]">
                    {item.sub}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right Column: Borderless Floating 3D House Centerpiece (NO square card!) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 180, damping: 20 }}
            className="relative flex flex-col items-center justify-center lg:col-span-6"
            style={{ perspective: 1200 }}
          >
            {/* Soft warm radial aura behind the house to blend with page background */}
            <div
              className="pointer-events-none absolute inset-6 -z-10 rounded-full blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, rgba(255, 241, 224, 0.85) 0%, rgba(244, 198, 168, 0.25) 55%, transparent 75%)",
              }}
            />

            <div
              ref={houseRef}
              onMouseMove={handleHouseMouseMove}
              onMouseLeave={() => setHouseTilt({ rotateX: 0, rotateY: 0 })}
              className="relative flex w-full max-w-[560px] flex-col items-center cursor-pointer"
              onClick={() => openModal("ENTER")}
              title="Click to enter your digital house"
            >
              <motion.div
                animate={{
                  rotateX: houseTilt.rotateX,
                  rotateY: houseTilt.rotateY,
                  y: [0, -10, 0],
                }}
                transition={{
                  rotateX: { type: "spring", stiffness: 260, damping: 22 },
                  rotateY: { type: "spring", stiffness: 260, damping: 22 },
                  y: { duration: 5.5, repeat: Infinity, ease: "easeInOut" },
                }}
                style={{ transformStyle: "preserve-3d" }}
                className="relative w-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/house-hero-cutout.png"
                  alt="Domus 3D Digital House"
                  className="mx-auto w-full max-w-[540px] select-none object-contain"
                  style={{
                    filter:
                      "drop-shadow(0 30px 38px rgba(96, 62, 42, 0.22)) drop-shadow(0 8px 14px rgba(96, 62, 42, 0.12))",
                  }}
                />
              </motion.div>

              {/* Soft floating 3D ground shadow that breathes with the house */}
              <motion.div
                animate={{
                  scaleX: [1, 0.92, 1],
                  opacity: [0.32, 0.2, 0.32],
                }}
                transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                className="-mt-4 h-7 w-[68%] rounded-full blur-xl"
                style={{
                  background:
                    "radial-gradient(ellipse, rgba(78, 50, 34, 0.55) 0%, transparent 72%)",
                }}
              />
            </div>
          </motion.div>
        </div>
      </main>

      {/* Subtle Bottom Security Note */}
      <footer className="mx-auto flex w-full max-w-6xl items-center justify-center gap-2 pt-2 text-xs font-medium text-[#7c6e63] sm:justify-start">
        <ShieldCheck className="h-3.5 w-3.5 text-sage-600" />
        <span>Encrypted Room Keys · Signed HTTP-only sessions</span>
      </footer>

      {/* Claymorphic Pop-up Modal: Enter House or Create House */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d1714]/40 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="domus-card relative w-full max-w-md space-y-6 p-6 sm:p-8"
            >
              {/* Modal Close Button */}
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setModalOpen(false)}
                className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-[#efe7dc] text-[#5c5047] transition hover:bg-[#e5d9ca] hover:text-[#1e1916]"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Strictly 2 Claymorphic Tabs */}
              <div
                className="mr-10 grid grid-cols-2 gap-1.5 rounded-2xl bg-[#efe7dc] p-1.5 text-xs font-bold"
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
                      autoFocus
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
                      autoFocus
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
                    autoFocus
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
