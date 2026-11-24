"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Calendar,
  Car,
  CheckCircle2,
  Crown,
  ShoppingCart,
} from "lucide-react";

interface IsometricHomeSceneProps {
  compact?: boolean;
}

export default function IsometricHomeScene({
  compact = false,
}: IsometricHomeSceneProps) {
  return (
    <div
      className={`iso-stage relative select-none overflow-hidden rounded-3xl border border-stone-200/80 bg-gradient-to-br from-stone-100/90 via-white to-terracotta-50/70 ${
        compact ? "h-48 px-6 py-4" : "h-64 px-6 py-6 sm:h-72"
      }`}
      style={{
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.95), 0 4px 0 0 rgba(212,206,192,0.85), 0 22px 45px -18px rgba(25,23,20,0.16)",
      }}
    >
      {/* Ambient sunlit glow orbs */}
      <div className="animate-pulse-soft pointer-events-none absolute -left-8 -top-8 h-36 w-36 rounded-full bg-terracotta-200/45 blur-2xl" />
      <div className="animate-pulse-soft pointer-events-none absolute -bottom-10 right-4 h-40 w-40 rounded-full bg-sage-200/55 blur-2xl" />

      {/* Isometric Architectural Floor Grid */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-75">
        <div
          className="iso-plane h-56 w-56 rounded-3xl border-2 border-stone-300/70 bg-gradient-to-br from-white/90 to-stone-100/80"
          style={{
            boxShadow:
              "-12px 14px 0 0 rgba(212,206,192,0.65), -24px 28px 40px rgba(25,23,20,0.14)",
            backgroundImage:
              "linear-gradient(to right, rgba(168,161,147,0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(168,161,147,0.16) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* Floating 2.5D Layer 1: Common Calendar Overlap Card */}
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.06, rotate: -1, y: -10 }}
        className="absolute left-5 top-5 z-20 w-44 cursor-default rounded-2xl border border-stone-200 bg-white/95 p-3 backdrop-blur sm:left-8 sm:w-48"
        style={{
          boxShadow:
            "inset 0 1px 0 #fff, 0 5px 0 0 #d4cec0, 0 16px 26px -10px rgba(25,23,20,0.22)",
        }}
      >
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-lg bg-terracotta-100 px-2 py-0.5 text-[10px] font-bold text-terracotta-700">
            <Calendar className="h-3 w-3" />
            OVERLAP
          </span>
          <div className="flex -space-x-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white bg-terracotta-500 text-[9px] font-bold text-white">
              AA
            </span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white bg-sage-500 text-[9px] font-bold text-white">
              ME
            </span>
          </div>
        </div>
        <p className="mt-2 text-xs font-bold text-stone-900">
          Morning Yoga Flow
        </p>
        <p className="text-[10px] text-stone-500">7:30 – 8:30 AM · Shared</p>
      </motion.div>

      {/* Floating 2.5D Layer 2: Driving Lesson / Life Plan Chip */}
      <motion.div
        animate={{ y: [0, -9, 0] }}
        transition={{
          duration: 5.4,
          delay: 0.6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        whileHover={{ scale: 1.07, rotate: 1.5, y: -12 }}
        className="absolute right-5 top-6 z-30 w-40 cursor-default rounded-2xl border border-stone-800 bg-gradient-to-b from-stone-800 to-stone-900 p-3 text-white sm:right-8 sm:w-44"
        style={{
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.22), 0 5px 0 0 #0b0a08, 0 18px 28px -10px rgba(25,23,20,0.42)",
        }}
      >
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-terracotta-300">
            <Car className="h-3 w-3 text-terracotta-400" />
            BOOKED TIME
          </span>
          <Crown className="h-3.5 w-3.5 text-amber-400" />
        </div>
        <p className="mt-1.5 text-xs font-semibold">Driving Lesson</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
          <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-terracotta-400 to-amber-300" />
        </div>
        <p className="mt-1 text-[10px] text-stone-300">18.5 / 30 hrs logged</p>
      </motion.div>

      {/* Floating 2.5D Layer 3: Lists & Chores Pill */}
      {!compact && (
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 4.5,
            delay: 1.1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          whileHover={{ scale: 1.06, y: -10 }}
          className="absolute bottom-5 left-10 z-30 flex cursor-default items-center gap-2.5 rounded-2xl border border-sage-200 bg-white/95 px-3.5 py-2.5 backdrop-blur sm:left-16"
          style={{
            boxShadow:
              "inset 0 1px 0 #fff, 0 4px 0 0 #c2dec8, 0 14px 24px -10px rgba(44,76,53,0.25)",
          }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sage-100 text-sage-700">
            <ShoppingCart className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-900">
              Meal Prep &amp; Lawn
            </p>
            <p className="flex items-center gap-1 text-[10px] font-medium text-sage-600">
              <CheckCircle2 className="h-3 w-3" /> 6 shared tasks synced
            </p>
          </div>
        </motion.div>
      )}

      {/* Floating 2.5D Layer 4: Wellness Orb */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration: 5.1,
          delay: 0.3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        whileHover={{ scale: 1.08, rotate: -2 }}
        className={`absolute right-8 z-20 flex cursor-default items-center gap-2 rounded-2xl border border-terracotta-200 bg-gradient-to-b from-terracotta-50 to-white px-3 py-2 ${
          compact ? "bottom-4" : "bottom-6 right-12"
        }`}
        style={{
          boxShadow:
            "inset 0 1px 0 #fff, 0 4px 0 0 #f6cfc0, 0 12px 22px -10px rgba(212,99,62,0.28)",
        }}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-terracotta-500 text-white">
          <Activity className="h-3.5 w-3.5" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-stone-900">Diet &amp; Run</p>
          <p className="text-[10px] font-semibold text-terracotta-600">
            82% weekly streak
          </p>
        </div>
      </motion.div>
    </div>
  );
}
