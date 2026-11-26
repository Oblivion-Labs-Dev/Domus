"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Check,
  Copy,
  DoorClosed,
  DoorOpen,
  Eraser,
  GripVertical,
  Hand,
  KeyRound,
  ListChecks,
  Plus,
  Send,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { AVATAR_PRESETS } from "@/lib/avatars";
import { MemberContext, ROLE_META, Role } from "@/lib/rbac";
import FamilyCalendarPanel from "./FamilyCalendarPanel";
import MemberAvatar from "./MemberAvatar";
import type {
  CalendarEventDTO,
  HouseholdDTO,
  HouseholdListDTO,
  MemberDTO,
  RoomKnockDTO,
} from "./types";

interface CommonAreaViewProps {
  currentMember: MemberContext;
  household: HouseholdDTO | null;
  members: MemberDTO[];
  onEnterRoom: (memberId: string) => void;
  onHouseholdChanged: () => Promise<void>;
  onKnocksChanged: () => Promise<void>;
  onOpenWallPaint: () => void;
}

const LIST_ICON_OPTIONS = [
  { id: "groceries", label: "Groceries", src: "/assets/decor-groceries.png" },
  { id: "meals", label: "Meal Prep", src: "/assets/decor-salad.png" },
  { id: "fitness", label: "Fitness", src: "/assets/decor-weights.png" },
  { id: "errands", label: "Errands", src: "/assets/decor-car.png" },
  { id: "home", label: "Home Care", src: "/assets/decor-toolbox.png" },
  { id: "plants", label: "Garden", src: "/assets/decor-plant.png" },
  { id: "coffee", label: "Treats", src: "/assets/decor-coffee.png" },
  { id: "pets", label: "Pets", src: "/assets/decor-cat.png" },
  { id: "general", label: "General", src: "/assets/board-3d.png" },
];

function getListIconSrc(type: string): string {
  if (type.startsWith("/assets/")) return type;
  const found = LIST_ICON_OPTIONS.find(
    (opt) => opt.id.toUpperCase() === type.toUpperCase()
  );
  if (found) return found.src;
  if (type === "SHOPPING") return "/assets/decor-groceries.png";
  if (type === "MEAL_PREP") return "/assets/decor-salad.png";
  if (type === "CHORES") return "/assets/decor-toolbox.png";
  return "/assets/board-3d.png";
}

export default function CommonAreaView({
  currentMember,
  household,
  members,
  onEnterRoom,
  onHouseholdChanged,
  onKnocksChanged,
  onOpenWallPaint,
}: CommonAreaViewProps) {
  // Data
  const [lists, setLists] = useState<HouseholdListDTO[]>([]);
  const [events, setEvents] = useState<CalendarEventDTO[]>([]);
  const [outgoingKnocks, setOutgoingKnocks] = useState<RoomKnockDTO[]>([]);
  const [incomingKnocks, setIncomingKnocks] = useState<RoomKnockDTO[]>([]);
  const [publicRoomOwners, setPublicRoomOwners] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);

  // Shared Lists UI
  const [newListOpen, setNewListOpen] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [newListIcon, setNewListIcon] = useState("/assets/decor-groceries.png");
  const [draftItems, setDraftItems] = useState<
    Record<string, { title: string; dueDate: string }>
  >({});

  // Silky pointer-based drag-and-drop (no ugly square browser ghost, zero flicker!)
  const listCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [pointerDrag, setPointerDrag] = useState<{
    item: HouseholdListDTO["items"][number];
    fromListId: string;
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
    width: number;
  } | null>(null);
  const [dragOverListId, setDragOverListId] = useState<string | null>(null);
  const dragOverRef = useRef<string | null>(null);

  // Knock Modal (for someone else's private door)
  const [knockTarget, setKnockTarget] = useState<MemberDTO | null>(null);
  const [knockMessage, setKnockMessage] = useState("");
  const [knockSending, setKnockSending] = useState(false);

  // Add Family Member Modal (for Head / Co-Head)
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<Role>("MEMBER");
  const [memberAvatarId, setMemberAvatarId] = useState("fox");
  const [memberSaving, setMemberSaving] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [mintedMemberKeycard, setMintedMemberKeycard] = useState<{
    name: string;
    houseKey: string;
    roomKey: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const canInvite =
    currentMember.role === "HEAD" || currentMember.role === "CO_HEAD";

  const loadAll = useCallback(async () => {
    try {
      const [listsRes, eventsRes, knocksRes, familyRes] = await Promise.all([
        fetch("/api/lists", { cache: "no-store" }),
        fetch("/api/calendar/events", { cache: "no-store" }),
        fetch("/api/rooms/knocks", { cache: "no-store" }),
        fetch("/api/family/members", { cache: "no-store" }),
      ]);

      if (listsRes.ok) {
        const d = await listsRes.json();
        setLists(d.lists ?? []);
      }
      if (eventsRes.ok) {
        const d = await eventsRes.json();
        setEvents(d.events ?? []);
      }
      if (knocksRes.ok) {
        const d = await knocksRes.json();
        setOutgoingKnocks(d.outgoing ?? []);
        setIncomingKnocks(d.incoming ?? []);
      }
      if (familyRes.ok) {
        const d = await familyRes.json();
        const pub = new Set<string>(
          (d.members ?? [])
            .filter((m: MemberDTO) => Boolean(m.isRoomPublic))
            .map((m: MemberDTO) => m.id)
        );
        setPublicRoomOwners(pub);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // --- Shared Lists Actions ---
  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    const res = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newListTitle.trim(),
        type: newListIcon,
        visibility: "FAMILY",
      }),
    });
    if (res.ok) {
      setNewListTitle("");
      setNewListOpen(false);
      await loadAll();
    }
  }

  async function handleDeleteList(listId: string) {
    await fetch(`/api/lists?id=${encodeURIComponent(listId)}`, {
      method: "DELETE",
    });
    await loadAll();
  }

  async function handleClearList(listId: string) {
    setLists((prev) =>
      prev.map((l) => (l.id === listId ? { ...l, items: [] } : l))
    );
    await fetch(`/api/lists/items?listId=${encodeURIComponent(listId)}`, {
      method: "DELETE",
    });
  }

  async function handleAddItem(e: React.FormEvent, listId: string) {
    e.preventDefault();
    const draft = draftItems[listId];
    if (!draft?.title.trim()) return;
    const res = await fetch("/api/lists/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listId,
        title: draft.title.trim(),
        dueDate: draft.dueDate || "",
        priority: "MEDIUM",
      }),
    });
    if (res.ok) {
      setDraftItems((prev) => ({
        ...prev,
        [listId]: { title: "", dueDate: "" },
      }));
      await loadAll();
    }
  }

  async function handleToggleItem(itemId: string, currentCompleted: boolean) {
    // Optimistic UI update for snappy check/strikethrough
    setLists((prev) =>
      prev.map((l) => ({
        ...l,
        items: l.items.map((it) =>
          it.id === itemId ? { ...it, isCompleted: !currentCompleted } : it
        ),
      }))
    );
    await fetch("/api/lists/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemId, isCompleted: !currentCompleted }),
    });
  }

  async function handleDeleteItem(itemId: string) {
    setLists((prev) =>
      prev.map((l) => ({
        ...l,
        items: l.items.filter((it) => it.id !== itemId),
      }))
    );
    await fetch(`/api/lists/items?id=${encodeURIComponent(itemId)}`, {
      method: "DELETE",
    });
  }

  const moveItemBetweenLists = useCallback(
    async (itemId: string, fromListId: string, targetListId: string) => {
      if (fromListId === targetListId) return;
      let snapshot: HouseholdListDTO[] = [];

      // Optimistic move between lists
      setLists((prev) => {
        snapshot = prev;
        let movedItem: HouseholdListDTO["items"][number] | null = null;
        const removed = prev.map((l) => {
          if (l.id !== fromListId) return l;
          const found = l.items.find((it) => it.id === itemId);
          if (found) movedItem = { ...found, listId: targetListId };
          return { ...l, items: l.items.filter((it) => it.id !== itemId) };
        });
        if (!movedItem) return prev;
        return removed.map((l) =>
          l.id === targetListId ? { ...l, items: [movedItem!, ...l.items] } : l
        );
      });

      try {
        const res = await fetch("/api/lists/items", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: itemId, listId: targetListId }),
        });
        if (!res.ok) {
          setLists(snapshot);
        }
      } catch {
        setLists(snapshot);
      }
    },
    []
  );

  function startPointerDrag(
    e: React.PointerEvent<HTMLDivElement>,
    item: HouseholdListDTO["items"][number],
    fromListId: string
  ) {
    // Ignore clicks on buttons/inputs inside the item (checkbox, delete)
    if ((e.target as HTMLElement).closest("button, input")) return;
    if (e.button !== 0) return;

    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const offsetX = startX - rect.left;
    const offsetY = startY - rect.top;
    const width = rect.width;
    let dragging = false;

    function hitTestList(cx: number, cy: number): string | null {
      for (const [id, node] of Object.entries(listCardRefs.current)) {
        if (!node) continue;
        const r = node.getBoundingClientRect();
        if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) {
          return id;
        }
      }
      return null;
    }

    function onMove(ev: PointerEvent) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!dragging && Math.hypot(dx, dy) < 5) return;
      if (!dragging) {
        dragging = true;
        document.body.style.userSelect = "none";
      }
      const hovered = hitTestList(ev.clientX, ev.clientY);
      dragOverRef.current = hovered;
      setDragOverListId(hovered);
      setPointerDrag({
        item,
        fromListId,
        x: ev.clientX,
        y: ev.clientY,
        offsetX,
        offsetY,
        width,
      });
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.body.style.userSelect = "";
      const target = dragOverRef.current;
      dragOverRef.current = null;
      setPointerDrag(null);
      setDragOverListId(null);
      if (dragging && target && target !== fromListId) {
        void moveItemBetweenLists(item.id, fromListId, target);
      }
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  // --- Door & Knock Actions ---
  async function handleSendKnock(withMessage: boolean) {
    if (!knockTarget) return;
    setKnockSending(true);
    try {
      await fetch("/api/rooms/knocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomOwnerId: knockTarget.id,
          message: withMessage ? knockMessage.trim() : "",
        }),
      });
      setKnockTarget(null);
      setKnockMessage("");
      await loadAll();
      await onKnocksChanged();
    } finally {
      setKnockSending(false);
    }
  }

  // --- Add Family Member Action ---
  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setMemberError(null);
    setMemberSaving(true);
    try {
      const res = await fetch("/api/family/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: memberName.trim(),
          email: memberEmail.trim(),
          role: memberRole,
          avatarId: memberAvatarId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMemberError(data.error ?? "Could not add family member.");
        return;
      }
      setMintedMemberKeycard({
        name: memberName.trim(),
        houseKey: data.houseKey ?? household?.houseKey ?? "DOMUS-HOME",
        roomKey: data.roomKey,
      });
      setMemberName("");
      setMemberEmail("");
      await onHouseholdChanged();
      await loadAll();
    } finally {
      setMemberSaving(false);
    }
  }

  async function copyValue(key: string, val: string) {
    try {
      await navigator.clipboard.writeText(val);
      setCopiedField(key);
      setTimeout(() => setCopiedField((p) => (p === key ? null : p)), 2000);
    } catch {
      // ignore
    }
  }

  const pendingIncomingCount = incomingKnocks.filter(
    (k) => k.status === "KNOCKING"
  ).length;

  return (
    <div className="space-y-4 pb-6">
      {/* TOP COMPACT HALLWAY STRIP: FAMILY DOORS */}
      <section className="domus-card px-4 py-3.5 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="mr-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-terracotta-600">
                Hallway
              </p>
              <h2 className="text-sm font-extrabold tracking-tight text-[#1e1916]">
                Family Doors
              </h2>
            </div>

            {members.map((m) => {
              const isMe = m.id === currentMember.id;
              const isPublic = publicRoomOwners.has(m.id);
              const myKnock = outgoingKnocks.find(
                (k) => k.roomOwnerId === m.id
              );
              const canEnterDirectly =
                isMe || isPublic || myKnock?.status === "ALLOWED";

              return (
                <motion.button
                  key={m.id}
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (canEnterDirectly) {
                      onEnterRoom(m.id);
                    } else {
                      setKnockTarget(m);
                      setKnockMessage("");
                    }
                  }}
                  className="domus-tile group flex items-center gap-2.5 px-3 py-2 text-left"
                >
                  <div className="relative flex shrink-0 items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/door-3d.png"
                      alt={`${m.name}'s door`}
                      className="h-9 w-9 object-contain mix-blend-multiply transition-transform group-hover:scale-105"
                    />
                    <div className="absolute -bottom-0.5 -right-1 rounded-full ring-2 ring-[#faf7f2]">
                      <MemberAvatar
                        initials={m.avatarInitials}
                        color={m.color}
                        avatarId={m.avatarId}
                        size="sm"
                      />
                    </div>
                  </div>

                  <div className="min-w-0 pr-1">
                    <p className="text-xs font-extrabold leading-tight text-[#1e1916]">
                      {m.name}
                    </p>
                    <span
                      className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        isMe
                          ? "bg-[#1f332b] text-white"
                          : canEnterDirectly
                          ? "bg-sage-100 text-sage-800"
                          : myKnock?.status === "KNOCKING"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-[#e7dfd4] text-[#5c5047]"
                      }`}
                    >
                      {isMe ? (
                        pendingIncomingCount > 0 ? (
                          `${pendingIncomingCount} Knocking`
                        ) : (
                          "My Room"
                        )
                      ) : canEnterDirectly ? (
                        <>
                          <DoorOpen className="h-2.5 w-2.5" /> Open
                        </>
                      ) : myKnock?.status === "KNOCKING" ? (
                        "Knocking..."
                      ) : (
                        <>
                          <DoorClosed className="h-2.5 w-2.5" /> Knock
                        </>
                      )}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            {canInvite && (
              <button
                type="button"
                onClick={() => {
                  setMintedMemberKeycard(null);
                  setMemberError(null);
                  setAddMemberOpen(true);
                }}
                className="domus-btn-secondary shrink-0 py-2 text-xs"
              >
                <UserPlus className="h-3.5 w-3.5 text-sage-700" />
                Add Member
              </button>
            )}

            {/* 2.5D Paint Bucket sitting right in the Common Room (matching tile hover) */}
            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenWallPaint}
              title="Paint the house walls or upload a background"
              className="domus-tile group flex items-center gap-2 px-3 py-1.5 text-left"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/paint-bucket-3d.png"
                alt="House Wall Paint Bucket"
                className="h-9 w-9 shrink-0 object-contain transition-transform group-hover:scale-105"
              />
              <div className="hidden sm:block">
                <p className="text-[11px] font-extrabold leading-tight text-[#1e1916]">
                  Wall Paint
                </p>
                <p className="text-[10px] font-medium text-[#6b5d53]">
                  Colors &amp; patterns
                </p>
              </div>
            </motion.button>
          </div>
        </div>
      </section>

      {/* MAIN SIDE-BY-SIDE BENTO WORKSPACE: SHARED LISTS (LEFT) + FAMILY CALENDAR (RIGHT) */}
      <div className="grid items-start gap-5 lg:grid-cols-12">
        {/* LEFT 7 COLS: UNRESTRICTED SHARED FAMILY LISTS */}
        <section className="space-y-4 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-[#1e1916]">
                <ListChecks className="h-4 w-4 text-terracotta-500" />
                Shared Family Lists
              </h2>
              <p className="text-[11px] text-[#6b5d53]">
                Drag items between lists, check them off, or add a date to sync
                to the calendar.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setNewListOpen((v) => !v)}
              className="domus-btn-accent py-2 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              New List
            </button>
          </div>

          {/* Inline New List Creator */}
          <AnimatePresence>
            {newListOpen && (
              <motion.form
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                onSubmit={handleCreateList}
                className="domus-card space-y-3.5 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-end gap-2.5">
                  <div className="min-w-[200px] flex-1">
                    <label className="mb-1 block text-xs font-bold text-[#4e433b]">
                      List Name <span className="text-terracotta-500">*</span>
                    </label>
                    <input
                      autoFocus
                      required
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                      placeholder="e.g., Groceries, Meal Prep, Relative Birthdays..."
                      className="domus-input py-2 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNewListOpen(false);
                        setNewListTitle("");
                      }}
                      className="domus-btn-secondary py-2 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="domus-btn-accent py-2 text-xs"
                    >
                      Create
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-[#6b5d53]">
                    Quick Pick or Icon (Optional)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {LIST_ICON_OPTIONS.map((opt) => {
                      const selected = newListIcon === opt.src;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setNewListIcon(opt.src);
                            const presetLabels = LIST_ICON_OPTIONS.map(
                              (o) => o.label
                            );
                            if (
                              !newListTitle.trim() ||
                              presetLabels.includes(newListTitle.trim())
                            ) {
                              setNewListTitle(opt.label);
                            }
                          }}
                          className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition ${
                            selected
                              ? "border-[#1f332b] bg-[#1f332b] text-white shadow-sm"
                              : "border-transparent bg-[#f3ede4] text-[#5c5047] hover:bg-[#eae0d3]"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={opt.src}
                            alt={opt.label}
                            className="h-4 w-4 rounded object-contain"
                          />
                          {opt.label}
                          {selected && <Check className="h-3 w-3" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Lists Grid (2 cols on sm+) */}
          {loading ? (
            <div className="domus-card p-6 text-center text-xs text-[#6b5d53]">
              Loading shared lists...
            </div>
          ) : lists.length === 0 ? (
            <div className="domus-card flex flex-col items-center justify-center gap-3 p-8 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/board-3d.png"
                alt="Shared lists"
                className="h-16 w-16 object-contain mix-blend-multiply"
              />
              <div>
                <h3 className="text-sm font-bold text-[#1e1916]">
                  No shared lists yet
                </h3>
                <p className="mt-1 max-w-xs text-xs text-[#6b5d53]">
                  Create any list for the whole house — groceries, meal prep,
                  errands, or birthdays.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNewListOpen(true)}
                className="domus-btn-accent py-2 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Create First List
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {lists.map((list) => {
                const draft = draftItems[list.id] ?? { title: "", dueDate: "" };
                const isDropTarget =
                  dragOverListId === list.id &&
                  pointerDrag?.fromListId !== list.id;

                return (
                  <div
                    key={list.id}
                    ref={(el) => {
                      listCardRefs.current[list.id] = el;
                    }}
                    className={`domus-card flex flex-col justify-between p-4 transition-all ${
                      isDropTarget
                        ? "ring-2 ring-terracotta-500 scale-[1.015] bg-terracotta-50/40"
                        : ""
                    }`}
                  >
                    <div className="space-y-3">
                      {/* List Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getListIconSrc(list.type)}
                            alt={list.title}
                            className="h-8 w-8 shrink-0 object-contain mix-blend-multiply"
                          />
                          <div>
                            <h3 className="text-sm font-extrabold leading-tight text-[#1e1916]">
                              {list.title}
                            </h3>
                            <p className="text-[10px] text-[#6b5d53]">
                              {isDropTarget ? (
                                <span className="font-bold text-terracotta-600">
                                  Drop here to move item
                                </span>
                              ) : (
                                <>
                                  {
                                    list.items.filter((i) => !i.isCompleted)
                                      .length
                                  }{" "}
                                  left · {list.items.length} total
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {list.items.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleClearList(list.id)}
                              title="Clear all items in this list"
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-[#7c6e63] transition hover:bg-[#efe7dc] hover:text-[#1e1916]"
                            >
                              <Eraser className="h-3 w-3" />
                              Clear
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteList(list.id)}
                            title="Delete list"
                            className="rounded-lg p-1 text-[#8a7c71] transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Draggable Items (Silky pointer drag — never square!) */}
                      <div className="space-y-1.5">
                        {list.items.length === 0 ? (
                          <p className="rounded-xl border border-dashed border-[#dfd4c6] px-2.5 py-3 text-center text-[11px] text-[#8a7c71]">
                            Add an item or drag one here.
                          </p>
                        ) : (
                          list.items.map((item) => {
                            const isBeingDragged =
                              pointerDrag?.item.id === item.id;
                            return (
                              <div
                                key={item.id}
                                onPointerDown={(e) =>
                                  startPointerDrag(e, item, list.id)
                                }
                                className={`group flex cursor-grab touch-none select-none items-center gap-2 rounded-xl bg-[#f3ede4] px-2.5 py-2 transition active:cursor-grabbing ${
                                  isBeingDragged
                                    ? "opacity-30 ring-1 ring-dashed ring-[#b8aa9c]"
                                    : item.isCompleted
                                    ? "opacity-60"
                                    : ""
                                }`}
                              >
                              <GripVertical className="h-3 w-3 shrink-0 text-[#a09184]" />

                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleItem(item.id, item.isCompleted)
                                }
                                aria-label={
                                  item.isCompleted
                                    ? "Mark incomplete"
                                    : "Mark done"
                                }
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border-2 transition ${
                                  item.isCompleted
                                    ? "border-sage-600 bg-sage-600 text-white"
                                    : "border-[#b8aa9c] bg-white hover:border-terracotta-500"
                                }`}
                              >
                                {item.isCompleted && (
                                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                                )}
                              </button>

                              <div className="min-w-0 flex-1">
                                <p
                                  className={`truncate text-xs font-semibold ${
                                    item.isCompleted
                                      ? "text-[#7c6e63] line-through"
                                      : "text-[#1e1916]"
                                  }`}
                                >
                                  {item.title}
                                </p>
                                {item.dueDate && (
                                  <p className="inline-flex items-center gap-1 text-[10px] font-semibold text-terracotta-600">
                                    <CalendarIcon className="h-2.5 w-2.5" />
                                    {item.dueDate}
                                  </p>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                title="Remove item"
                                className="rounded-md p-0.5 text-[#8a7c71] opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Inline Add Item Row */}
                    <form
                      onSubmit={(e) => handleAddItem(e, list.id)}
                      className="mt-3 space-y-1.5 border-t border-[#e8dfd3] pt-2.5"
                    >
                      <div className="flex gap-1.5">
                        <input
                          value={draft.title}
                          onChange={(e) =>
                            setDraftItems((prev) => ({
                              ...prev,
                              [list.id]: { ...draft, title: e.target.value },
                            }))
                          }
                          placeholder="Add item..."
                          className="domus-input py-1.5 text-xs"
                        />
                        <button
                          type="submit"
                          disabled={!draft.title.trim()}
                          className="domus-btn-primary shrink-0 px-2.5 py-1.5 text-xs disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-[#7c6e63]">
                          <CalendarIcon className="h-2.5 w-2.5" />
                          Date (optional):
                        </span>
                        <input
                          type="date"
                          value={draft.dueDate}
                          onChange={(e) =>
                            setDraftItems((prev) => ({
                              ...prev,
                              [list.id]: { ...draft, dueDate: e.target.value },
                            }))
                          }
                          className="rounded-lg border border-[#dfd4c6] bg-white/80 px-1.5 py-0.5 text-[10px] font-medium text-[#4e433b]"
                        />
                      </div>
                    </form>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* RIGHT 5 COLS: MULTI-VIEW FAMILY & PERSONAL CALENDAR (Month | Week | Day + Day Detail Sheet + Participant Sync) */}
        <FamilyCalendarPanel
          currentMember={currentMember}
          members={members}
          events={events}
          lists={lists}
          onRefresh={loadAll}
        />
      </div>

      {/* MODAL 1: KNOCK ON A FAMILY MEMBER'S DOOR (Quiet Knock OR With Message) */}
      <AnimatePresence>
        {knockTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setKnockTarget(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d1714]/40 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="domus-card relative w-full max-w-md space-y-5 p-6 sm:p-7"
            >
              <button
                type="button"
                onClick={() => setKnockTarget(null)}
                className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-[#efe7dc] text-[#5c5047] hover:bg-[#e5d9ca]"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3">
                <MemberAvatar
                  initials={knockTarget.avatarInitials}
                  color={knockTarget.color}
                  avatarId={knockTarget.avatarId}
                  size="md"
                />
                <div>
                  <h3 className="text-base font-extrabold text-[#1e1916]">
                    Knock on {knockTarget.name}&apos;s Door
                  </h3>
                  <p className="text-xs text-[#6b5d53]">
                    {knockTarget.name} will see your knock and can let you in.
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#4e433b]">
                  Add a Note (Optional)
                </label>
                <input
                  autoFocus
                  value={knockMessage}
                  onChange={(e) => setKnockMessage(e.target.value)}
                  placeholder="e.g., Dinner's ready! or Quick question..."
                  className="domus-input"
                />
              </div>

              <div className="flex flex-col gap-2.5 sm:flex-row">
                <button
                  type="button"
                  disabled={knockSending}
                  onClick={() => handleSendKnock(false)}
                  className="domus-btn-secondary flex-1 py-2.5 text-xs"
                >
                  <Hand className="h-3.5 w-3.5 text-terracotta-500" />
                  Knock Quietly (No Note)
                </button>
                <button
                  type="button"
                  disabled={knockSending || !knockMessage.trim()}
                  onClick={() => handleSendKnock(true)}
                  className="domus-btn-accent flex-1 py-2.5 text-xs disabled:opacity-45"
                >
                  <Send className="h-3.5 w-3.5" />
                  Knock with Note
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ADD FAMILY MEMBER (Auto-Mints Room Key + Welcome Keycard) */}
      <AnimatePresence>
        {addMemberOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!mintedMemberKeycard) setAddMemberOpen(false);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d1714]/40 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="domus-card relative w-full max-w-md space-y-5 p-6 sm:p-7"
            >
              <button
                type="button"
                onClick={() => {
                  setAddMemberOpen(false);
                  setMintedMemberKeycard(null);
                }}
                className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-[#efe7dc] text-[#5c5047] hover:bg-[#e5d9ca]"
              >
                <X className="h-4 w-4" />
              </button>

              {mintedMemberKeycard ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sage-100 text-sage-700">
                      <KeyRound className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-sage-700">
                        Door Ready · Share Keys
                      </p>
                      <h3 className="text-base font-extrabold text-[#1e1916]">
                        {mintedMemberKeycard.name}&apos;s Keys
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-2xl bg-[#f3ece2] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#6b5d53]">
                          House Key
                        </p>
                        <p className="font-mono text-sm font-extrabold text-[#1e1916]">
                          {mintedMemberKeycard.houseKey}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          copyValue("mHouse", mintedMemberKeycard.houseKey)
                        }
                        className="domus-btn-secondary px-2.5 py-1.5 text-xs"
                      >
                        {copiedField === "mHouse" ? (
                          <Check className="h-3.5 w-3.5 text-sage-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="border-t border-[#e2d7c8]" />
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#6b5d53]">
                          {mintedMemberKeycard.name}&apos;s Personal Room Key
                        </p>
                        <p className="font-mono text-sm font-extrabold text-[#1e1916]">
                          {mintedMemberKeycard.roomKey}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          copyValue("mRoom", mintedMemberKeycard.roomKey)
                        }
                        className="domus-btn-secondary px-2.5 py-1.5 text-xs"
                      >
                        {copiedField === "mRoom" ? (
                          <Check className="h-3.5 w-3.5 text-sage-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAddMemberOpen(false);
                      setMintedMemberKeycard(null);
                    }}
                    className="domus-btn-accent w-full py-2.5 text-xs"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAddMember} className="space-y-4">
                  <div>
                    <h3 className="text-base font-extrabold text-[#1e1916]">
                      Add a Family Member
                    </h3>
                    <p className="mt-0.5 text-xs text-[#6b5d53]">
                      We&apos;ll create their private door and automatically
                      mint their personal Room Key.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#4e433b]">
                      Name <span className="text-terracotta-500">*</span>
                    </label>
                    <input
                      autoFocus
                      required
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      placeholder="e.g., Meera"
                      className="domus-input"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#4e433b]">
                      Recovery Email{" "}
                      <span className="text-terracotta-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      placeholder="For key recovery"
                      className="domus-input"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#4e433b]">
                      Role <span className="text-terracotta-500">*</span>
                    </label>
                    <select
                      value={memberRole}
                      onChange={(e) => setMemberRole(e.target.value as Role)}
                      className="domus-input"
                    >
                      {(["CO_HEAD", "MEMBER", "JUNIOR", "GUEST"] as Role[]).map(
                        (r) => (
                          <option key={r} value={r}>
                            {ROLE_META[r].label} — {ROLE_META[r].description}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold text-[#4e433b]">
                      Avatar
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {AVATAR_PRESETS.slice(0, 7).map((av) => (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => setMemberAvatarId(av.id)}
                          className={`rounded-full p-0.5 transition ${
                            memberAvatarId === av.id
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

                  {memberError && (
                    <p className="rounded-2xl bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700">
                      {memberError}
                    </p>
                  )}

                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setAddMemberOpen(false)}
                      className="domus-btn-secondary flex-1 py-2.5 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={memberSaving}
                      className="domus-btn-accent flex-1 py-2.5 text-xs"
                    >
                      {memberSaving ? "Minting Key..." : "Add & Mint Key"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING ROUNDED DRAG PILL (smooth, rounded, never square!) */}
      {pointerDrag && (
        <div
          className="pointer-events-none fixed z-50 flex items-center gap-2 rounded-2xl border border-white/90 bg-[#faf7f2] px-3 py-2.5 shadow-2xl ring-2 ring-terracotta-500/70"
          style={{
            left: pointerDrag.x - pointerDrag.offsetX,
            top: pointerDrag.y - pointerDrag.offsetY,
            width: pointerDrag.width,
            transform: "scale(1.03) rotate(1deg)",
          }}
        >
          <GripVertical className="h-3.5 w-3.5 shrink-0 text-terracotta-500" />
          <div
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border-2 ${
              pointerDrag.item.isCompleted
                ? "border-sage-600 bg-sage-600 text-white"
                : "border-[#b8aa9c] bg-white"
            }`}
          >
            {pointerDrag.item.isCompleted && (
              <Check className="h-2.5 w-2.5 stroke-[3]" />
            )}
          </div>
          <span
            className={`truncate text-xs font-bold ${
              pointerDrag.item.isCompleted
                ? "text-[#7c6e63] line-through"
                : "text-[#1e1916]"
            }`}
          >
            {pointerDrag.item.title}
          </span>
        </div>
      )}
    </div>
  );
}
