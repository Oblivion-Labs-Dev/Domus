"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  X,
} from "lucide-react";
import type { ActiveTab } from "./types";

interface HouseTourProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (tab: ActiveTab) => void;
}

interface TourStep {
  title: string;
  badge: string;
  tab: ActiveTab;
  image: string;
  body: string;
  tryIt: string;
}

const STEPS: TourStep[] = [
  {
    title: "Welcome to Your Digital House",
    badge: "Step 1 of 6 · Overview",
    tab: "common",
    image: "/assets/house-hero.png",
    body: "Domus is built like a real home: a shared Common Area for house boards, chores, and gear — plus private Personal Rooms that every family member decorates and arranges their own way.",
    tryIt: "We kept starter data minimal so you can build your real home from scratch.",
  },
  {
    title: "Common Board, Sticky Notes & Pick-Up",
    badge: "Step 2 of 6 · Common Area",
    tab: "common",
    image: "/assets/board-3d.png",
    body: "Click 'New Task Card' or 'New Sticky Note' to pin work, add custom columns, assign tags & priorities, and drag cards across columns. Hit 'Pick Up' on any unclaimed chore to claim it into your Room.",
    tryIt: "Add a date/time to any card (or click '+ Cal') to sync it straight to the Calendar.",
  },
  {
    title: "Shared House Gear (Zero Double-Booking)",
    badge: "Step 3 of 6 · House Gear",
    tab: "common",
    image: "/assets/decor-mower.png",
    body: "Attach shared items like the Family Car or Lawn Mower to any board card or calendar event. Domus tracks their availability automatically so nobody accidentally books the same gear at once.",
    tryIt: "Look at the Shared House Gear strip right above the Common Board.",
  },
  {
    title: "Your Flexible Room & 2.5D Decor Shop",
    badge: "Step 4 of 6 · My Room",
    tab: "room",
    image: "/assets/decor-armchair.png",
    body: "Every family member has their own private space. Click 'Open 2.5D Shop' to browse 20+ miniature clay items (plants, lamps, yoga, coffee, pets, study desks), change your wall theme, and reorder room sections.",
    tryIt: "Your claimed house tasks, personal drag-and-drop board, and trackers all live here.",
  },
  {
    title: "Universal Privacy: Knock with a Message",
    badge: "Step 5 of 6 · Family & Doors",
    tab: "family",
    image: "/assets/door-3d.png",
    body: "Nobody can peek into anyone's room — not even the Head of Household. Head to Family & Doors, click 'Knock on Door', and include a quick message. Once the owner clicks 'Let In', you can visit!",
    tryIt: "You can also close your door (revoke access) from inside your Room anytime.",
  },
  {
    title: "Daily, Weekly & Yearly Calendar + Time Booking",
    badge: "Step 6 of 6 · Calendar",
    tab: "calendar",
    image: "/assets/calendar-3d.png",
    body: "Switch between Daily hourly timelines, a 7-day Weekly grid, and a full 12-month Yearly heatmap. Need someone's time? Pick a family member to see conflict-free open slots and send a booking request.",
    tryIt: "Click any day in Yearly or Weekly view to zoom straight into that day's schedule.",
  },
];

export default function HouseTour({
  open,
  onClose,
  onNavigate,
}: HouseTourProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];

  function goTo(nextIdx: number) {
    setStepIdx(nextIdx);
    const nextStep = STEPS[nextIdx];
    if (nextStep) {
      onNavigate(nextStep.tab);
    }
  }

  function handleFinish() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("domus_tour_seen", "true");
    }
    setStepIdx(0);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/45 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="domus-card relative w-full max-w-xl overflow-hidden bg-white p-6"
          >
            <button
              onClick={handleFinish}
              aria-label="Close tour"
              className="absolute right-4 top-4 rounded-xl p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-800"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
              <motion.div
                key={step.image}
                initial={{ opacity: 0, scale: 0.88, rotate: -3 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="h-32 w-32 shrink-0 overflow-hidden rounded-3xl border-2 border-white bg-[#faf9f5] shadow-md"
                style={{
                  boxShadow:
                    "0 5px 0 0 rgba(212,206,192,0.85), 0 16px 28px -12px rgba(25,23,20,0.24)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={step.image}
                  alt={step.title}
                  className="h-full w-full object-cover"
                />
              </motion.div>

              <div className="space-y-2.5 text-center sm:text-left">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-terracotta-50 px-2.5 py-1 text-[11px] font-bold text-terracotta-700">
                  <Compass className="h-3.5 w-3.5" />
                  {step.badge}
                </span>
                <h3 className="text-xl font-bold tracking-tight text-stone-900">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-stone-600">
                  {step.body}
                </p>
                <p className="rounded-xl border border-sage-200 bg-sage-50/80 px-3 py-2 text-xs font-semibold text-sage-800">
                  💡 {step.tryIt}
                </p>
              </div>
            </div>

            {/* Progress dots + navigation */}
            <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-4">
              <div className="flex items-center gap-1.5">
                {STEPS.map((s, idx) => (
                  <button
                    key={s.title}
                    onClick={() => goTo(idx)}
                    aria-label={`Go to step ${idx + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      idx === stepIdx
                        ? "w-6 bg-terracotta-500"
                        : "w-2 bg-stone-200 hover:bg-stone-300"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {stepIdx > 0 && (
                  <button
                    onClick={() => goTo(stepIdx - 1)}
                    className="domus-btn-secondary px-3 py-1.5 text-xs"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>
                )}
                {stepIdx < STEPS.length - 1 ? (
                  <button
                    onClick={() => goTo(stepIdx + 1)}
                    className="domus-btn-primary px-4 py-1.5 text-xs"
                  >
                    Next
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleFinish}
                    className="domus-btn-accent px-4 py-1.5 text-xs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Start Using Domus
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
