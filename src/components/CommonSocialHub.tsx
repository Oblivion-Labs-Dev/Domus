"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Dumbbell,
  Plus,
  Trash2,
  Users,
  Utensils,
  Vote,
} from "lucide-react";
import type { MemberContext } from "@/lib/rbac";
import MemberAvatar from "./MemberAvatar";
import type { MemberDTO } from "./types";

interface PollOption {
  id: string;
  label: string;
  voterIds: string[];
}

interface PollDTO {
  id: string;
  question: string;
  tag: string;
  options: PollOption[];
  createdById: string;
}

interface FridgeMealDTO {
  id: string;
  date: string;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER";
  dish: string;
  chefId: string | null;
  notes: string | null;
}

interface GroupWorkoutDTO {
  id: string;
  title: string;
  date: string;
  exercises: string[];
  participantIds: string[];
  completedIds: string[];
  createdById: string;
}

interface CommonSocialHubProps {
  currentMember: MemberContext;
  members: MemberDTO[];
}

export default function CommonSocialHub({
  currentMember,
  members,
}: CommonSocialHubProps) {
  const [tab, setTab] = useState<"fridge" | "workouts" | "polls">("fridge");
  const [meals, setMeals] = useState<FridgeMealDTO[]>([]);
  const [workouts, setWorkouts] = useState<GroupWorkoutDTO[]>([]);
  const [polls, setPolls] = useState<PollDTO[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  // Fridge Meal form
  const [showMealForm, setShowMealForm] = useState(false);
  const [mealDate, setMealDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [mealType, setMealType] = useState<"BREAKFAST" | "LUNCH" | "DINNER">(
    "DINNER"
  );
  const [mealDish, setMealDish] = useState("");
  const [mealChef, setMealChef] = useState(currentMember.id);
  const [mealNotes, setMealNotes] = useState("");

  // Group Workout form
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [wrkTitle, setWrkTitle] = useState("");
  const [wrkDate, setWrkDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [wrkExercises, setWrkExercises] = useState("");

  // House Poll form
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptionsText, setPollOptionsText] = useState("");
  const [pollTag, setPollTag] = useState("meal");

  const memberById = new Map(members.map((m) => [m.id, m]));

  const loadAll = useCallback(async () => {
    const [mRes, wRes, pRes] = await Promise.all([
      fetch("/api/common/fridge"),
      fetch("/api/common/workouts"),
      fetch("/api/common/polls"),
    ]);
    if (mRes.ok) setMeals((await mRes.json()).meals ?? []);
    if (wRes.ok) setWorkouts((await wRes.json()).workouts ?? []);
    if (pRes.ok) setPolls((await pRes.json()).polls ?? []);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll, currentMember.id]);

  async function handleAddMeal(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    const res = await fetch("/api/common/fridge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: mealDate,
        mealType,
        dish: mealDish,
        chefId: mealChef,
        notes: mealNotes,
      }),
    });
    if (res.ok) {
      setMealDish("");
      setMealNotes("");
      setShowMealForm(false);
      setNotice("Pinned to the Fridge & synced as a #meal note on everyone's Calendar!");
      await loadAll();
    }
  }

  async function handleDeleteMeal(id: string) {
    await fetch(`/api/common/fridge?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await loadAll();
  }

  async function handleAddWorkout(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    const exercises = wrkExercises
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await fetch("/api/common/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: wrkTitle,
        date: wrkDate,
        exercises,
      }),
    });
    if (res.ok) {
      setWrkTitle("");
      setWrkExercises("");
      setShowWorkoutForm(false);
      setNotice("Shared workout posted & added to the Calendar! Others can click 'I'm In!'");
      await loadAll();
    }
  }

  async function handleWorkoutAction(
    workoutId: string,
    action: "JOIN_TOGGLE" | "COMPLETE_TOGGLE"
  ) {
    await fetch("/api/common/workouts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workoutId, action }),
    });
    await loadAll();
  }

  async function handleAddPoll(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    const options = pollOptionsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await fetch("/api/common/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: pollQuestion,
        tag: pollTag,
        options,
      }),
    });
    if (res.ok) {
      setPollQuestion("");
      setPollOptionsText("");
      setShowPollForm(false);
      await loadAll();
    }
  }

  async function handleVote(pollId: string, optionId: string) {
    await fetch("/api/common/polls", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pollId, optionId }),
    });
    await loadAll();
  }

  return (
    <div className="domus-card space-y-5 p-5">
      {/* Header + 3 Clean Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-stone-100 p-1">
          {(
            [
              ["fridge", "Fridge Meal Notes", Utensils],
              ["workouts", "Group Workouts", Dumbbell],
              ["polls", "House Votes", Vote],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                tab === id
                  ? "text-white"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              {tab === id && (
                <motion.span
                  layoutId="common-social-pill"
                  transition={{ type: "spring", stiffness: 420, damping: 30 }}
                  className="absolute inset-0 rounded-xl bg-stone-900"
                />
              )}
              <span className="relative z-10 inline-flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
            </button>
          ))}
        </div>

        <div>
          {tab === "fridge" && (
            <button
              onClick={() => setShowMealForm((v) => !v)}
              className="domus-btn-accent py-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Pin Fridge Meal
            </button>
          )}
          {tab === "workouts" && (
            <button
              onClick={() => setShowWorkoutForm((v) => !v)}
              className="domus-btn-accent py-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Plan Group Workout
            </button>
          )}
          {tab === "polls" && (
            <button
              onClick={() => setShowPollForm((v) => !v)}
              className="domus-btn-accent py-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Start House Vote
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div className="rounded-xl border border-sage-200 bg-sage-50 px-3.5 py-2 text-xs font-semibold text-sage-800">
          {notice}
        </div>
      )}

      {/* TAB 1: FRIDGE MEAL NOTES (auto-synced to everyone's calendar with #meal!) */}
      {tab === "fridge" && (
        <div className="space-y-4">
          <AnimatePresence>
            {showMealForm && (
              <motion.form
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                onSubmit={handleAddMeal}
                className="grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:grid-cols-2 lg:grid-cols-4"
              >
                <input
                  required
                  value={mealDish}
                  onChange={(e) => setMealDish(e.target.value)}
                  placeholder="What are we cooking? (e.g., Paneer Bowls)"
                  className="domus-input sm:col-span-2"
                />
                <input
                  type="date"
                  required
                  value={mealDate}
                  onChange={(e) => setMealDate(e.target.value)}
                  className="domus-input"
                />
                <select
                  value={mealType}
                  onChange={(e) =>
                    setMealType(
                      e.target.value as "BREAKFAST" | "LUNCH" | "DINNER"
                    )
                  }
                  className="domus-input"
                >
                  <option value="BREAKFAST">Breakfast</option>
                  <option value="LUNCH">Lunch</option>
                  <option value="DINNER">Dinner</option>
                </select>
                <select
                  value={mealChef}
                  onChange={(e) => setMealChef(e.target.value)}
                  className="domus-input"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      Chef: {m.name}
                    </option>
                  ))}
                </select>
                <input
                  value={mealNotes}
                  onChange={(e) => setMealNotes(e.target.value)}
                  placeholder="Ingredients or prep note (optional)..."
                  className="domus-input lg:col-span-2"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMealForm(false)}
                    className="domus-btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="domus-btn-primary text-xs">
                    Pin to Fridge
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {meals.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-stone-50/70 p-6 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/decor-salad.png"
                alt="Fridge Meal"
                className="h-14 w-14 rounded-2xl object-cover"
              />
              <p className="text-xs font-bold text-stone-700">
                No Fridge Meal Notes yet
              </p>
              <p className="max-w-md text-xs text-stone-500">
                Pin what the family is cooking each day — it automatically shows
                up as a <code>#meal</code> note in everyone&apos;s Calendar!
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {meals.map((m) => {
                const chef = m.chefId ? memberById.get(m.chefId) : null;
                return (
                  <div
                    key={m.id}
                    className="domus-tile group relative border-amber-200/90 bg-amber-50/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-full bg-terracotta-100 px-2 py-0.5 text-[10px] font-bold text-terracotta-700">
                        #meal · {m.mealType} · {m.date}
                      </span>
                      <button
                        onClick={() => handleDeleteMeal(m.id)}
                        className="rounded p-1 text-stone-400 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="mt-2 text-sm font-bold text-stone-900">
                      🍽️ {m.dish}
                    </p>
                    {m.notes && (
                      <p className="mt-1 text-xs text-stone-600">{m.notes}</p>
                    )}
                    {chef && (
                      <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-stone-600">
                        <MemberAvatar
                          initials={chef.avatarInitials}
                          color={chef.color}
                          avatarId={chef.avatarId}
                          size="sm"
                        />
                        <span>Cooking: {chef.name}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GROUP WORKOUTS ("Me + 2 others doing Push Day today!") */}
      {tab === "workouts" && (
        <div className="space-y-4">
          <AnimatePresence>
            {showWorkoutForm && (
              <motion.form
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                onSubmit={handleAddWorkout}
                className="grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:grid-cols-3"
              >
                <input
                  required
                  value={wrkTitle}
                  onChange={(e) => setWrkTitle(e.target.value)}
                  placeholder="Session (e.g., Push Day, Leg Day, Yoga)"
                  className="domus-input"
                />
                <input
                  type="date"
                  value={wrkDate}
                  onChange={(e) => setWrkDate(e.target.value)}
                  className="domus-input"
                />
                <input
                  value={wrkExercises}
                  onChange={(e) => setWrkExercises(e.target.value)}
                  placeholder="Exercises (Bench Press, OHP, Dips...)"
                  className="domus-input"
                />
                <div className="flex justify-end gap-2 sm:col-span-3">
                  <button
                    type="button"
                    onClick={() => setShowWorkoutForm(false)}
                    className="domus-btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="domus-btn-primary text-xs">
                    Post Group Workout
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {workouts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-stone-50/70 p-6 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/decor-weights.png"
                alt="Group Workouts"
                className="h-14 w-14 rounded-2xl object-cover"
              />
              <p className="text-xs font-bold text-stone-700">
                No Group Workouts scheduled yet
              </p>
              <p className="max-w-md text-xs text-stone-500">
                Planning Push Day or Yoga together? Post a session so family
                members can tap <strong>I&apos;m In!</strong> and check off
                their completion together.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {workouts.map((w) => {
                const isJoined = w.participantIds.includes(currentMember.id);
                const isDone = w.completedIds.includes(currentMember.id);
                return (
                  <div key={w.id} className="domus-tile space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="rounded-full bg-sage-100 px-2 py-0.5 text-[10px] font-bold text-sage-700">
                          {w.date} · {w.participantIds.length} joined
                        </span>
                        <h4 className="mt-1.5 text-sm font-bold text-stone-900">
                          🏋️ {w.title}
                        </h4>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() =>
                            handleWorkoutAction(w.id, "JOIN_TOGGLE")
                          }
                          className={
                            isJoined
                              ? "domus-btn-secondary px-2.5 py-1 text-[11px]"
                              : "domus-btn-primary px-2.5 py-1 text-[11px]"
                          }
                        >
                          <Users className="h-3 w-3" />
                          {isJoined ? "Joined" : "I'm In!"}
                        </button>
                        <button
                          onClick={() =>
                            handleWorkoutAction(w.id, "COMPLETE_TOGGLE")
                          }
                          className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition ${
                            isDone
                              ? "bg-sage-600 text-white"
                              : "border border-stone-200 bg-white text-stone-700 hover:bg-sage-50"
                          }`}
                        >
                          <Check className="inline h-3 w-3" />{" "}
                          {isDone ? "Done!" : "Mark Done"}
                        </button>
                      </div>
                    </div>

                    {w.exercises.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {w.exercises.map((ex, i) => (
                          <span
                            key={i}
                            className="rounded-lg bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-700"
                          >
                            {ex}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-2.5">
                      {w.participantIds.map((pid) => {
                        const pm = memberById.get(pid);
                        if (!pm) return null;
                        const finished = w.completedIds.includes(pid);
                        return (
                          <span
                            key={pid}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              finished
                                ? "bg-sage-100 text-sage-800"
                                : "bg-stone-100 text-stone-700"
                            }`}
                          >
                            {pm.name} {finished ? "✓" : ""}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HOUSE VOTES / POLLS */}
      {tab === "polls" && (
        <div className="space-y-4">
          <AnimatePresence>
            {showPollForm && (
              <motion.form
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                onSubmit={handleAddPoll}
                className="grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:grid-cols-3"
              >
                <input
                  required
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Question (e.g., Dinner tonight?)"
                  className="domus-input"
                />
                <input
                  required
                  value={pollOptionsText}
                  onChange={(e) => setPollOptionsText(e.target.value)}
                  placeholder="Options comma-separated (Pasta, Tacos, Curry)"
                  className="domus-input"
                />
                <select
                  value={pollTag}
                  onChange={(e) => setPollTag(e.target.value)}
                  className="domus-input"
                >
                  <option value="meal">#meal</option>
                  <option value="workout">#workout</option>
                  <option value="weekend">#weekend</option>
                  <option value="home">#home</option>
                </select>
                <div className="flex justify-end gap-2 sm:col-span-3">
                  <button
                    type="button"
                    onClick={() => setShowPollForm(false)}
                    className="domus-btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="domus-btn-primary text-xs">
                    Launch Vote
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {polls.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/70 p-6 text-center">
              <p className="text-xs font-bold text-stone-700">
                No active House Votes yet
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Start a quick family vote on tonight&apos;s meal, weekend plans,
                or group workouts!
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {polls.map((poll) => {
                const totalVotes = poll.options.reduce(
                  (sum, o) => sum + o.voterIds.length,
                  0
                );
                return (
                  <div key={poll.id} className="domus-tile space-y-3 p-4">
                    <div>
                      <span className="rounded-full bg-terracotta-100 px-2 py-0.5 text-[10px] font-bold text-terracotta-700">
                        #{poll.tag} · {totalVotes} vote
                        {totalVotes === 1 ? "" : "s"}
                      </span>
                      <h4 className="mt-1.5 text-sm font-bold text-stone-900">
                        {poll.question}
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {poll.options.map((opt) => {
                        const myVote = opt.voterIds.includes(currentMember.id);
                        const pct =
                          totalVotes > 0
                            ? Math.round(
                                (opt.voterIds.length / totalVotes) * 100
                              )
                            : 0;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => handleVote(poll.id, opt.id)}
                            className={`relative w-full overflow-hidden rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                              myVote
                                ? "border-terracotta-400 bg-terracotta-50/70 text-stone-900"
                                : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                            }`}
                          >
                            <div
                              className="pointer-events-none absolute inset-y-0 left-0 bg-terracotta-200/45 transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                            <div className="relative z-10 flex items-center justify-between">
                              <span>
                                {myVote ? "✓ " : ""}
                                {opt.label}
                              </span>
                              <span className="text-[11px] font-bold text-stone-600">
                                {opt.voterIds.length} ({pct}%)
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
