"use client";

import { motion } from "framer-motion";
import { ArrowRight, Compass, KeyRound } from "lucide-react";
import type { MemberContext } from "@/lib/rbac";
import MemberAvatar from "./MemberAvatar";
import TiltCard from "./TiltCard";
import type { ActiveTab, HouseholdDTO } from "./types";

interface HouseEntrywayProps {
  currentMember: MemberContext;
  household: HouseholdDTO | null;
  knockCount: number;
  onEnter: (tab: ActiveTab) => void;
  onStartTour: () => void;
}

export default function HouseEntryway({
  currentMember,
  household,
  knockCount,
  onEnter,
  onStartTour,
}: HouseEntrywayProps) {
  const doorways: Array<{
    tab: ActiveTab;
    title: string;
    subtitle: string;
    image: string;
    badge?: string;
    glow: string;
  }> = [
    {
      tab: "common",
      title: "Common Living Room",
      subtitle:
        "Shared house board, unclaimed chores to pick up, sticky notes & House Gear.",
      image: "/assets/board-3d.png",
      glow: "rgba(212, 90, 51, 0.16)",
    },
    {
      tab: "room",
      title: `${currentMember.name}'s Private Room`,
      subtitle:
        "Your flexible canvas — personal board, trackers & drag-anywhere 2.5D decor.",
      image: "/assets/door-3d.png",
      badge: knockCount > 0 ? `${knockCount} Knocking` : "Private",
      glow: "rgba(59, 110, 82, 0.18)",
    },
    {
      tab: "calendar",
      title: "House Calendar",
      subtitle:
        "Daily, Weekly & Yearly schedules, overlaps & conflict-free time booking.",
      image: "/assets/calendar-3d.png",
      glow: "rgba(54, 85, 120, 0.18)",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-4 sm:py-8">
      {/* Calm 2.5D Architectural Welcome Porch */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="domus-card overflow-hidden p-6 sm:p-8"
      >
        <div className="grid items-center gap-6 md:grid-cols-12">
          <div className="space-y-3 md:col-span-7">
            <div className="flex items-center gap-3">
              <MemberAvatar
                initials={currentMember.avatarInitials}
                color={currentMember.color}
                avatarId={
                  (currentMember.permissions as Record<string, unknown>)
                    ?.avatarId as string | undefined
                }
                size="md"
              />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-terracotta-600">
                  {household?.name ?? "The Domus Residence"}
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                  Welcome home, {currentMember.name}
                </h1>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-stone-600">
              Choose which door you&apos;d like to walk through today — jump
              into the shared Living Room, arrange your private Room, or open
              the multi-view Calendar.
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                onClick={() => onEnter("common")}
                className="domus-btn-accent"
              >
                Step Inside
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={onStartTour}
                className="domus-btn-secondary text-xs"
              >
                <Compass className="h-3.5 w-3.5 text-terracotta-500" />
                Take a Quick Tour
              </button>
              <button
                onClick={() => onEnter("family")}
                className="domus-btn-secondary text-xs"
              >
                <KeyRound className="h-3.5 w-3.5 text-sage-600" />
                Family Doors &amp; Keys
              </button>
            </div>
          </div>

          <div className="md:col-span-5">
            <motion.div
              whileHover={{ y: -4, rotate: -1 }}
              className="overflow-hidden rounded-3xl border-2 border-white bg-[#faf9f5] shadow-md"
              style={{
                boxShadow:
                  "0 6px 0 0 rgba(202,187,165,0.85), 0 20px 34px -14px rgba(25,21,18,0.22)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/house-hero.png"
                alt="Domus Home"
                className="h-52 w-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* 3 Big 2.5D Doorway Cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        {doorways.map((door, idx) => (
          <motion.button
            key={door.tab}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + idx * 0.06 }}
            onClick={() => onEnter(door.tab)}
            className="text-left"
          >
            <TiltCard
              maxTilt={6}
              lift={6}
              glowColor={door.glow}
              className="group flex h-full flex-col justify-between p-5"
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={door.image}
                    alt={door.title}
                    className="h-20 w-20 rounded-2xl border-2 border-white bg-[#faf9f5] object-cover shadow-md transition-transform duration-200 group-hover:scale-105"
                  />
                  {door.badge && (
                    <span className="rounded-full bg-terracotta-100 px-2.5 py-0.5 text-[10px] font-bold text-terracotta-700">
                      {door.badge}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-900">
                    {door.title}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-stone-500">
                    {door.subtitle}
                  </p>
                </div>
              </div>
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-terracotta-600 transition-transform group-hover:translate-x-1">
                Open Door
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </TiltCard>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
