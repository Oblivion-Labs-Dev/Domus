"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Columns3,
  GripVertical,
  Hand,
  Plus,
  StickyNote,
  Tag,
  Trash2,
  Wrench,
} from "lucide-react";
import { NOTE_COLORS, NoteColorId } from "@/lib/decor";
import type { MemberContext } from "@/lib/rbac";
import type {
  BoardCardDTO,
  BoardColumnDTO,
  BoardDTO,
  HouseResourceDTO,
  MemberDTO,
} from "./types";

interface InteractiveBoardProps {
  board: BoardDTO;
  columns: BoardColumnDTO[];
  cards: BoardCardDTO[];
  members: MemberDTO[];
  resources: HouseResourceDTO[];
  currentMember: MemberContext;
  readOnly?: boolean;
  onRefresh: () => Promise<void>;
}

export default function InteractiveBoard({
  board,
  columns,
  cards,
  members,
  resources,
  currentMember,
  readOnly = false,
  onRefresh,
}: InteractiveBoardProps) {
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  // Add column state
  const [showAddCol, setShowAddCol] = useState(false);
  const [newColTitle, setNewColTitle] = useState("");
  const [newColColor, setNewColColor] = useState("#4f7c5b");

  // Add card/note composer state
  const [composerColId, setComposerColId] = useState<string | null>(null);
  const [cardType, setCardType] = useState<"TASK" | "NOTE">("TASK");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [noteColor, setNoteColor] = useState<NoteColorId>("cream");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">(
    "MEDIUM"
  );
  const [tagsText, setTagsText] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [startClock, setStartClock] = useState("10:00");
  const [endClock, setEndClock] = useState("11:00");
  const [resourceId, setResourceId] = useState("");
  const [syncToCommon, setSyncToCommon] = useState(board.scope === "COMMON");

  // Quick schedule popover on existing card
  const [scheduleCardId, setScheduleCardId] = useState<string | null>(null);
  const [schedDate, setSchedDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [schedStart, setSchedStart] = useState("10:00");
  const [schedEnd, setSchedEnd] = useState("11:00");

  const memberById = new Map(members.map((m) => [m.id, m]));
  const resourceById = new Map(resources.map((r) => [r.id, r]));

  async function handleDrop(targetColId: string) {
    if (readOnly || !draggingCardId) return;
    const card = cards.find((c) => c.id === draggingCardId);
    setDraggingCardId(null);
    setDragOverColId(null);
    if (!card || card.columnId === targetColId) return;

    await fetch(`/api/boards/cards/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columnId: targetColId }),
    });
    await onRefresh();
  }

  async function handleAddColumn(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const res = await fetch("/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boardId: board.id,
        title: newColTitle,
        color: newColColor,
      }),
    });
    const d = await res.json();
    if (!res.ok) {
      setFeedback({ type: "err", text: d.error ?? "Could not add column" });
      return;
    }
    setNewColTitle("");
    setShowAddCol(false);
    await onRefresh();
  }

  async function handleCreateCard(e: React.FormEvent) {
    e.preventDefault();
    if (!composerColId) return;
    setFeedback(null);

    const tags = tagsText
      .split(",")
      .map((t) => t.replace(/^#/, "").trim())
      .filter(Boolean);

    const startTime = dueDate
      ? new Date(`${dueDate}T${startClock}:00`).toISOString()
      : "";
    const endTime = dueDate
      ? new Date(`${dueDate}T${endClock}:00`).toISOString()
      : "";

    const res = await fetch("/api/boards/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boardId: board.id,
        columnId: composerColId,
        title,
        description,
        cardType,
        noteColor,
        priority,
        tags,
        dueDate,
        startTime,
        endTime,
        resourceId: resourceId || null,
        syncToCommonCalendar: syncToCommon,
      }),
    });
    const d = await res.json();
    if (!res.ok) {
      setFeedback({ type: "err", text: d.error ?? "Could not add card" });
      return;
    }

    setTitle("");
    setDescription("");
    setTagsText("");
    setDueDate("");
    setResourceId("");
    setComposerColId(null);
    setFeedback({
      type: "ok",
      text: d.linkedEventId
        ? "Pinned to board & synced directly to the Calendar!"
        : "Pinned to board!",
    });
    await onRefresh();
  }

  async function handlePickUp(cardId: string) {
    setFeedback(null);
    const res = await fetch(`/api/boards/cards/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "PICK_UP" }),
    });
    if (res.ok) {
      setFeedback({
        type: "ok",
        text: `Picked up! This task is now assigned to ${currentMember.name} and linked to your Personal Room.`,
      });
      await onRefresh();
    }
  }

  async function handleQuickSchedule(e: React.FormEvent, cardId: string) {
    e.preventDefault();
    setFeedback(null);
    const startTime = new Date(`${schedDate}T${schedStart}:00`).toISOString();
    const endTime = new Date(`${schedDate}T${schedEnd}:00`).toISOString();
    const res = await fetch(`/api/boards/cards/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dueDate: schedDate, startTime, endTime }),
    });
    if (res.ok) {
      setScheduleCardId(null);
      setFeedback({
        type: "ok",
        text: "Scheduled onto the Calendar!",
      });
      await onRefresh();
    }
  }

  async function handleDeleteCard(cardId: string) {
    await fetch(`/api/boards/cards/${cardId}`, { method: "DELETE" });
    await onRefresh();
  }

  const priorityBadge = (p: BoardCardDTO["priority"]) => {
    if (p === "URGENT") return "bg-red-100 text-red-700";
    if (p === "HIGH") return "bg-terracotta-100 text-terracotta-700";
    if (p === "MEDIUM") return "bg-amber-100 text-amber-800";
    return "bg-stone-100 text-stone-600";
  };

  return (
    <div className="space-y-4">
      {/* Board Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-stone-900">{board.title}</h3>
          {board.description && (
            <p className="text-xs text-stone-500">{board.description}</p>
          )}
        </div>

        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setCardType("NOTE");
                setNoteColor("butter");
                setComposerColId(columns[0]?.id ?? null);
              }}
              className="domus-btn-secondary whitespace-nowrap text-xs"
            >
              <StickyNote className="h-3.5 w-3.5 text-amber-600" />
              New Sticky Note
            </button>
            <button
              onClick={() => {
                setCardType("TASK");
                setNoteColor("cream");
                setComposerColId(columns[0]?.id ?? null);
              }}
              className="domus-btn-accent whitespace-nowrap text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              New Task Card
            </button>
            <button
              onClick={() => setShowAddCol((v) => !v)}
              className="domus-btn-secondary whitespace-nowrap text-xs"
            >
              <Columns3 className="h-3.5 w-3.5" />
              + Column
            </button>
          </div>
        )}
      </div>

      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl border px-4 py-2.5 text-xs font-semibold ${
            feedback.type === "ok"
              ? "border-sage-200 bg-sage-50 text-sage-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.text}
        </motion.div>
      )}

      {/* Add Column Form */}
      <AnimatePresence>
        {showAddCol && !readOnly && (
          <motion.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onSubmit={handleAddColumn}
            className="domus-card flex flex-wrap items-end gap-3 p-4"
          >
            <div className="min-w-[180px] flex-1">
              <label className="mb-1 block text-xs font-semibold text-stone-600">
                New Column Name
              </label>
              <input
                required
                value={newColTitle}
                onChange={(e) => setNewColTitle(e.target.value)}
                placeholder="e.g., Weekend Ideas, Grocery Run, Waiting..."
                className="domus-input"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-600">
                Accent
              </label>
              <input
                type="color"
                value={newColColor}
                onChange={(e) => setNewColColor(e.target.value)}
                className="h-9 w-14 cursor-pointer rounded-xl border border-stone-200 bg-white p-1"
              />
            </div>
            <button type="submit" className="domus-btn-primary text-xs">
              Add Column
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Rich 2.5D Card & Sticky Note Composer */}
      <AnimatePresence>
        {composerColId && !readOnly && (
          <motion.form
            initial={{ opacity: 0, y: -12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.985 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            onSubmit={handleCreateCard}
            className="domus-card space-y-4 p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-stone-900">
                {cardType === "NOTE"
                  ? "Pin a Colored Sticky Note"
                  : "Create a Tactile Board Task"}
              </h4>
              <div className="flex items-center gap-1.5">
                {(Object.keys(NOTE_COLORS) as NoteColorId[]).map((cid) => (
                  <button
                    key={cid}
                    type="button"
                    title={NOTE_COLORS[cid].name}
                    onClick={() => setNoteColor(cid)}
                    className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                      noteColor === cid
                        ? "scale-110 border-stone-900"
                        : "border-stone-300"
                    }`}
                    style={{ backgroundColor: NOTE_COLORS[cid].swatch }}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-stone-600">
                  Title
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Mow back lawn, Buy berries, Practice parallel parking"
                  className="domus-input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">
                  Column
                </label>
                <select
                  value={composerColId}
                  onChange={(e) => setComposerColId(e.target.value)}
                  className="domus-input"
                >
                  {columns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) =>
                    setPriority(
                      e.target.value as "LOW" | "MEDIUM" | "HIGH" | "URGENT"
                    )
                  }
                  className="domus-input"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-stone-600">
                  Details / Note Body
                </label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Checklist notes, quantities, or context..."
                  className="domus-input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">
                  Tags (comma-separated)
                </label>
                <input
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                  placeholder="lawn, weekend, diet"
                  className="domus-input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">
                  Reserve House Gear (optional)
                </label>
                <select
                  value={resourceId}
                  onChange={(e) => setResourceId(e.target.value)}
                  className="domus-input"
                >
                  <option value="">No shared gear</option>
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">
                  Schedule Date (auto-adds to Calendar!)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="domus-input"
                />
              </div>
              {dueDate && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={startClock}
                      onChange={(e) => setStartClock(e.target.value)}
                      className="domus-input"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-stone-600">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={endClock}
                      onChange={(e) => setEndClock(e.target.value)}
                      className="domus-input"
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-stone-700">
                      <input
                        type="checkbox"
                        checked={syncToCommon}
                        onChange={(e) => setSyncToCommon(e.target.checked)}
                        className="rounded border-stone-300"
                      />
                      Show on Common Calendar
                    </label>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setComposerColId(null)}
                className="domus-btn-secondary text-xs"
              >
                Cancel
              </button>
              <button type="submit" className="domus-btn-primary text-xs">
                Pin to Board
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Drag & Drop 2.5D Board Columns */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((col) => {
          const colCards = cards.filter((c) => c.columnId === col.id);
          const isDropTarget = dragOverColId === col.id;
          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                if (readOnly) return;
                e.preventDefault();
                setDragOverColId(col.id);
              }}
              onDragLeave={() => {
                if (dragOverColId === col.id) setDragOverColId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(col.id);
              }}
              className={`flex min-h-[280px] flex-col rounded-2xl border p-3.5 transition-all duration-200 ${
                isDropTarget
                  ? "border-terracotta-400 bg-terracotta-50/50 ring-2 ring-terracotta-200"
                  : "border-stone-200/80 bg-stone-100/65"
              }`}
              style={{
                boxShadow: "inset 0 2px 5px rgba(25,23,20,0.04)",
              }}
            >
              {/* Column Header */}
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full shadow-sm"
                    style={{ backgroundColor: col.color }}
                  />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    {col.title}
                  </h4>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-stone-500 shadow-sm">
                    {colCards.length}
                  </span>
                </div>
                {!readOnly && (
                  <button
                    onClick={() => {
                      setCardType("TASK");
                      setComposerColId(col.id);
                    }}
                    title={`Add to ${col.title}`}
                    className="rounded-lg p-1 text-stone-400 transition hover:bg-white hover:text-stone-800"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Cards Stack */}
              <div className="flex-1 space-y-3">
                {colCards.map((card) => {
                  const style =
                    NOTE_COLORS[card.noteColor] ?? NOTE_COLORS.cream;
                  const assignee = card.assigneeId
                    ? memberById.get(card.assigneeId)
                    : null;
                  const gear = card.resourceId
                    ? resourceById.get(card.resourceId)
                    : null;
                  const isUnclaimedCommon =
                    board.scope === "COMMON" &&
                    card.cardType === "TASK" &&
                    !card.assigneeId;

                  return (
                    <motion.div
                      key={card.id}
                      layout
                      initial={{ opacity: 0, y: 10, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      whileHover={{
                        y: -3,
                        rotate: card.cardType === "NOTE" ? -0.6 : 0,
                      }}
                      draggable={!readOnly}
                      onDragStart={() => setDraggingCardId(card.id)}
                      onDragEnd={() => {
                        setDraggingCardId(null);
                        setDragOverColId(null);
                      }}
                      className={`group relative rounded-2xl border p-3.5 transition-shadow ${
                        style.cardClass
                      } ${!readOnly ? "cursor-grab active:cursor-grabbing" : ""}`}
                      style={{
                        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.9), ${style.edgeShadow}, 0 10px 20px -12px rgba(25,23,20,0.18)`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${priorityBadge(
                              card.priority
                            )}`}
                          >
                            {card.priority}
                          </span>
                          {card.cardType === "NOTE" && (
                            <span className="rounded-md bg-amber-200/70 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                              NOTE
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {!readOnly && (
                            <GripVertical className="h-3.5 w-3.5 text-stone-300" />
                          )}
                          {!readOnly && (
                            <button
                              onClick={() => handleDeleteCard(card.id)}
                              className="rounded p-0.5 text-stone-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                              title="Delete card"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="mt-2 text-sm font-bold leading-snug text-stone-900">
                        {card.title}
                      </p>

                      {card.description && (
                        <p className="mt-1 text-xs leading-relaxed text-stone-600">
                          {card.description}
                        </p>
                      )}

                      {/* Tags & House Gear chips */}
                      {(card.tags.length > 0 || gear) && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {gear && (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white/90 px-2 py-0.5 text-[10px] font-bold text-stone-700 shadow-sm">
                              <Wrench className="h-2.5 w-2.5 text-terracotta-500" />
                              {gear.name}
                            </span>
                          )}
                          {card.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-0.5 rounded-md bg-black/5 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600"
                            >
                              <Tag className="h-2.5 w-2.5" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer: Assignee + Calendar badge + Pick Up CTA */}
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-black/5 pt-2.5">
                        <div className="flex items-center gap-1.5">
                          {assignee ? (
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-sm"
                              style={{ backgroundColor: assignee.color }}
                            >
                              {assignee.name}
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-stone-400">
                              Unclaimed
                            </span>
                          )}

                          {card.dueDate && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-sage-100 px-2 py-0.5 text-[10px] font-bold text-sage-700">
                              <Calendar className="h-2.5 w-2.5" />
                              {card.dueDate}
                            </span>
                          )}
                        </div>

                        {!readOnly && (
                          <div className="flex items-center gap-1">
                            {isUnclaimedCommon && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.94 }}
                                onClick={() => handlePickUp(card.id)}
                                className="inline-flex items-center gap-1 rounded-lg bg-stone-900 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm hover:bg-terracotta-500"
                              >
                                <Hand className="h-3 w-3" />
                                Pick Up
                              </motion.button>
                            )}
                            {!card.dueDate && (
                              <button
                                onClick={() =>
                                  setScheduleCardId(
                                    scheduleCardId === card.id ? null : card.id
                                  )
                                }
                                title="Add to Calendar"
                                className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-[10px] font-bold text-stone-600 hover:border-stone-400 hover:text-stone-900"
                              >
                                + Cal
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Inline 1-Click Calendar Scheduler */}
                      {scheduleCardId === card.id && !readOnly && (
                        <form
                          onSubmit={(e) => handleQuickSchedule(e, card.id)}
                          className="mt-2.5 space-y-2 rounded-xl border border-stone-200 bg-white p-2.5 shadow-sm"
                        >
                          <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">
                            Add to Calendar
                          </p>
                          <input
                            type="date"
                            required
                            value={schedDate}
                            onChange={(e) => setSchedDate(e.target.value)}
                            className="domus-input py-1 text-xs"
                          />
                          <div className="grid grid-cols-2 gap-1.5">
                            <input
                              type="time"
                              value={schedStart}
                              onChange={(e) => setSchedStart(e.target.value)}
                              className="domus-input py-1 text-xs"
                            />
                            <input
                              type="time"
                              value={schedEnd}
                              onChange={(e) => setSchedEnd(e.target.value)}
                              className="domus-input py-1 text-xs"
                            />
                          </div>
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setScheduleCardId(null)}
                              className="rounded-lg px-2 py-1 text-[11px] text-stone-500"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="rounded-lg bg-stone-900 px-2.5 py-1 text-[11px] font-bold text-white"
                            >
                              Schedule
                            </button>
                          </div>
                        </form>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
