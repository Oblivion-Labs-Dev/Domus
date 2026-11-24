"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Car, Dumbbell, Plus, Salad, Sparkles } from "lucide-react";
import { can, MemberContext } from "@/lib/rbac";
import ProgressRing25D from "./ProgressRing25D";
import TiltCard from "./TiltCard";
import { MemberDTO, TrackerDTO, TrackerLogDTO } from "./types";

interface TrackersViewProps {
  currentMember: MemberContext;
  members: MemberDTO[];
}

export default function TrackersView({
  currentMember,
  members,
}: TrackersViewProps) {
  const [trackers, setTrackers] = useState<TrackerDTO[]>([]);
  const [logs, setLogs] = useState<TrackerLogDTO[]>([]);
  const [typeFilter, setTypeFilter] = useState<
    "ALL" | "EXERCISE" | "DIET" | "LIFE_PLAN"
  >("ALL");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  // New tracker form
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"EXERCISE" | "DIET" | "LIFE_PLAN">(
    "EXERCISE"
  );
  const [category, setCategory] = useState("Yoga");
  const [unit, setUnit] = useState("sessions");
  const [targetValue, setTargetValue] = useState(5);
  const [cadence, setCadence] = useState<"DAILY" | "WEEKLY" | "MILESTONE">(
    "WEEKLY"
  );
  const [notes, setNotes] = useState("");

  // Quick log state per tracker
  const [logTrackerId, setLogTrackerId] = useState<string | null>(null);
  const [logValue, setLogValue] = useState("1");
  const [logNote, setLogNote] = useState("");

  const memberById = new Map(members.map((m) => [m.id, m]));
  const trackerById = new Map(trackers.map((t) => [t.id, t]));

  async function loadTrackers() {
    setLoading(true);
    try {
      const res = await fetch("/api/trackers");
      if (res.ok) {
        const d = await res.json();
        setTrackers(d.trackers ?? []);
        setLogs(d.logs ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrackers();
  }, [currentMember.id]);

  async function handleCreateTracker(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const res = await fetch("/api/trackers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        type,
        category,
        unit,
        targetValue: Number(targetValue),
        cadence,
        visibility: "FAMILY",
        notes,
      }),
    });
    const d = await res.json();
    if (!res.ok) {
      setFeedback(d.error ?? "Failed to create tracker");
      return;
    }
    setTitle("");
    setNotes("");
    setShowCreate(false);
    setFeedback("New household tracker created!");
    await loadTrackers();
  }

  async function handleLogProgress(e: React.FormEvent, trackerId: string) {
    e.preventDefault();
    setFeedback(null);
    const res = await fetch("/api/trackers/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackerId,
        date: new Date().toISOString().slice(0, 10),
        value: Number(logValue),
        note: logNote,
      }),
    });
    const d = await res.json();
    if (!res.ok) {
      setFeedback(d.error ?? "Could not log progress");
      return;
    }
    setLogTrackerId(null);
    setLogValue("1");
    setLogNote("");
    setFeedback("Progress logged!");
    await loadTrackers();
  }

  const canCreate = can(currentMember, "tracker:create_own");
  const filtered = trackers.filter((t) =>
    typeFilter === "ALL" ? true : t.type === typeFilter
  );

  const iconForType = (t: TrackerDTO["type"]) => {
    if (t === "EXERCISE") return <Dumbbell className="h-4 w-4 text-sage-600" />;
    if (t === "DIET") return <Salad className="h-4 w-4 text-terracotta-500" />;
    return <Car className="h-4 w-4 text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-sage-600">
            Household Habits &amp; Plans
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
            Exercise, Diet &amp; Life Plan Trackers
          </h2>
          <p className="text-sm text-stone-500">
            Track everyone&apos;s workouts, yoga streaks, clean diet targets,
            and long-running plans like driving lessons in one shared view.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="domus-btn-primary"
          >
            <Plus className="h-4 w-4" />
            {showCreate ? "Close Form" : "New Plan / Tracker"}
          </button>
        )}
      </div>

      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-sage-200 bg-sage-50 px-4 py-2.5 text-sm font-medium text-sage-700"
        >
          {feedback}
        </motion.div>
      )}

      <AnimatePresence>
        {showCreate && canCreate && (
          <motion.form
            initial={{ opacity: 0, y: -12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.985 }}
            onSubmit={handleCreateTracker}
            className="domus-card space-y-4 p-5"
          >
            <h3 className="text-sm font-bold text-stone-900">
              Create Exercise, Diet, or Life Plan Tracker
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">
                  Plan Title
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., 30-Day Yoga, Driving Hours, Protein Goal"
                  className="domus-input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">
                  Tracker Group
                </label>
                <select
                  value={type}
                  onChange={(e) =>
                    setType(e.target.value as "EXERCISE" | "DIET" | "LIFE_PLAN")
                  }
                  className="domus-input"
                >
                  <option value="EXERCISE">Exercise &amp; Yoga</option>
                  <option value="DIET">Diet &amp; Nutrition</option>
                  <option value="LIFE_PLAN">Life Plan (Driving, etc.)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">
                  Category Tag
                </label>
                <input
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Yoga / Driving / Diet"
                  className="domus-input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">
                  Target Value
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  required
                  value={targetValue}
                  onChange={(e) => setTargetValue(Number(e.target.value))}
                  className="domus-input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">
                  Unit
                </label>
                <input
                  required
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="sessions / hours / mins / meals / glasses"
                  className="domus-input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">
                  Cadence
                </label>
                <select
                  value={cadence}
                  onChange={(e) =>
                    setCadence(
                      e.target.value as "DAILY" | "WEEKLY" | "MILESTONE"
                    )
                  }
                  className="domus-input"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MILESTONE">Milestone Goal</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-600">
                Plan Notes
              </label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Target routine or family coordination notes"
                className="domus-input"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="domus-btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="domus-btn-primary">
                Create Tracker
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Spring Filter Tabs */}
      <div className="inline-flex flex-wrap gap-1.5 rounded-2xl border border-stone-200 bg-white/80 p-1.5 shadow-sm">
        {(
          [
            ["ALL", "All Trackers"],
            ["EXERCISE", "Exercise & Yoga"],
            ["DIET", "Diet & Hydration"],
            ["LIFE_PLAN", "Life Plans (Driving, etc.)"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTypeFilter(key)}
            className={`relative rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
              typeFilter === key
                ? "text-white"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            {typeFilter === key && (
              <motion.span
                layoutId="tracker-filter-pill"
                transition={{ type: "spring", stiffness: 420, damping: 30 }}
                className="absolute inset-0 rounded-xl bg-stone-900"
                style={{ boxShadow: "0 3px 0 0 #0b0a08" }}
              />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        ))}
      </div>

      {!loading && trackers.length === 0 ? (
        <div className="domus-card p-8 text-center">
          <Activity className="mx-auto h-8 w-8 text-stone-300" />
          <p className="mt-2 text-sm font-bold text-stone-700">
            No trackers visible for your role.
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Guests cannot view family health or personal plans unless the Head
            of Household grants the <code>canViewAllHealth</code> override.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
            {filtered.map((trk, idx) => {
              const owner = memberById.get(trk.memberId);
              const pct = Math.min(
                100,
                Math.round((trk.currentValue / trk.targetValue) * 100)
              );
              const canLog =
                canCreate &&
                (trk.memberId === currentMember.id ||
                  currentMember.role === "HEAD" ||
                  currentMember.role === "CO_HEAD");

              return (
                <motion.div
                  key={trk.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <TiltCard
                    maxTilt={6}
                    lift={5}
                    glowColor={`${owner?.color ?? "#4f7c5b"}22`}
                    className="flex flex-col justify-between p-5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100"
                            style={{
                              boxShadow:
                                "inset 0 1px 0 #fff, 0 2px 0 0 rgba(212,206,192,0.85)",
                            }}
                          >
                            {iconForType(trk.type)}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                              {trk.cadence} · {trk.category}
                            </span>
                            <h4 className="text-sm font-bold text-stone-900">
                              {trk.title}
                            </h4>
                          </div>
                        </div>

                        <ProgressRing25D
                          percent={pct}
                          color={owner?.color ?? "#4f7c5b"}
                          size={50}
                          strokeWidth={5}
                        />
                      </div>

                      {trk.notes && (
                        <p className="text-xs text-stone-500">{trk.notes}</p>
                      )}

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-stone-900">
                            {trk.currentValue}{" "}
                            <span className="text-xs font-medium text-stone-500">
                              / {trk.targetValue} {trk.unit}
                            </span>
                          </span>
                          {owner && (
                            <span
                              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm"
                              style={{ backgroundColor: owner.color }}
                            >
                              {owner.name}
                            </span>
                          )}
                        </div>
                        <div
                          className="h-2.5 overflow-hidden rounded-full bg-stone-100"
                          style={{
                            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.08)",
                          }}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{
                              type: "spring",
                              stiffness: 110,
                              damping: 18,
                            }}
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: owner?.color ?? "#4f7c5b",
                              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.4)`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {canLog && (
                      <div className="mt-4 border-t border-stone-100 pt-3">
                        {logTrackerId === trk.id ? (
                          <form
                            onSubmit={(e) => handleLogProgress(e, trk.id)}
                            className="space-y-2"
                          >
                            <div className="flex gap-2">
                              <input
                                type="number"
                                step="0.5"
                                min="0.1"
                                required
                                value={logValue}
                                onChange={(e) => setLogValue(e.target.value)}
                                className="domus-input w-24"
                                placeholder="Qty"
                              />
                              <input
                                value={logNote}
                                onChange={(e) => setLogNote(e.target.value)}
                                className="domus-input flex-1"
                                placeholder={`Note (${trk.unit})...`}
                              />
                            </div>
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setLogTrackerId(null)}
                                className="domus-btn-secondary px-2.5 py-1 text-xs"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="domus-btn-primary px-3 py-1 text-xs"
                              >
                                Save Log
                              </button>
                            </div>
                          </form>
                        ) : (
                          <button
                            onClick={() => {
                              setLogTrackerId(trk.id);
                              setLogValue("1");
                            }}
                            className="domus-btn-secondary w-full py-1.5 text-xs"
                          >
                            + Log {trk.unit}
                          </button>
                        )}
                      </div>
                    )}
                  </TiltCard>
                </motion.div>
              );
            })}
          </div>

          {/* Activity Feed */}
          <div className="domus-card h-fit p-5 lg:col-span-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sage-600" />
              <h3 className="text-sm font-bold text-stone-900">
                Recent Family Check-Ins
              </h3>
            </div>
            <div className="space-y-2.5">
              {logs.length === 0 ? (
                <p className="text-xs text-stone-500">No logs recorded yet.</p>
              ) : (
                logs.map((log) => {
                  const m = memberById.get(log.memberId);
                  const t = trackerById.get(log.trackerId);
                  return (
                    <motion.div
                      key={log.id}
                      whileHover={{ x: 3 }}
                      className="domus-tile p-3"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-900">
                          {m?.name ?? "Member"} logged +{log.value}{" "}
                          {t?.unit ?? ""}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          {log.date}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs font-semibold text-stone-600">
                        {t?.title}
                      </p>
                      {log.note && (
                        <p className="mt-1 text-xs text-stone-500">
                          {log.note}
                        </p>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
