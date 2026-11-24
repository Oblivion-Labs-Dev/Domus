"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Plus,
  ShoppingCart,
  Trash2,
  Utensils,
  Wrench,
} from "lucide-react";
import { can, MemberContext } from "@/lib/rbac";
import { HouseholdListDTO, ListItemDTO, MemberDTO } from "./types";

interface ListsViewProps {
  currentMember: MemberContext;
  members: MemberDTO[];
}

export default function ListsView({ currentMember, members }: ListsViewProps) {
  const [lists, setLists] = useState<HouseholdListDTO[]>([]);
  const [activeListId, setActiveListId] = useState<string>("");
  const [filterMode, setFilterMode] = useState<"ALL" | "MINE" | "OPEN">("ALL");
  const [feedback, setFeedback] = useState<string | null>(null);

  // New item state
  const [itemTitle, setItemTitle] = useState("");
  const [itemCategory, setItemCategory] = useState("General");
  const [itemQty, setItemQty] = useState("");
  const [itemAssignee, setItemAssignee] = useState<string>("");
  const [itemPriority, setItemPriority] = useState<"LOW" | "MEDIUM" | "HIGH">(
    "MEDIUM"
  );

  // New list state
  const [showNewList, setShowNewList] = useState(false);
  const [listTitle, setListTitle] = useState("");
  const [listType, setListType] = useState<
    "SHOPPING" | "MEAL_PREP" | "CHORES" | "GENERAL"
  >("SHOPPING");

  const memberById = new Map(members.map((m) => [m.id, m]));

  async function loadLists() {
    const res = await fetch("/api/lists");
    if (res.ok) {
      const d = await res.json();
      const loaded: HouseholdListDTO[] = d.lists ?? [];
      setLists(loaded);
      if (!activeListId && loaded[0]) {
        setActiveListId(loaded[0].id);
      }
    }
  }

  useEffect(() => {
    loadLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMember.id]);

  const activeList = lists.find((l) => l.id === activeListId) ?? lists[0];
  const canCreateList = can(currentMember, "list:create_or_delete");
  const canAssignOthers = can(currentMember, "list:assign_others");

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!activeList) return;
    setFeedback(null);

    const res = await fetch("/api/lists/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listId: activeList.id,
        title: itemTitle,
        category: itemCategory,
        quantity: itemQty,
        assigneeId: itemAssignee || null,
        priority: itemPriority,
      }),
    });
    const d = await res.json();
    if (!res.ok) {
      setFeedback(d.error ?? "Failed to add item");
      return;
    }
    setItemTitle("");
    setItemQty("");
    await loadLists();
  }

  async function handleToggle(item: ListItemDTO) {
    await fetch(`/api/lists/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: !item.isCompleted }),
    });
    await loadLists();
  }

  async function handleDeleteItem(id: string) {
    setFeedback(null);
    const res = await fetch(`/api/lists/items/${id}`, { method: "DELETE" });
    const d = await res.json();
    if (!res.ok) {
      setFeedback(d.error ?? "Cannot delete item");
      return;
    }
    await loadLists();
  }

  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const res = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: listTitle,
        type: listType,
        visibility: "FAMILY",
      }),
    });
    const d = await res.json();
    if (!res.ok) {
      setFeedback(d.error ?? "Could not create list");
      return;
    }
    setListTitle("");
    setShowNewList(false);
    setActiveListId(d.id);
    await loadLists();
  }

  const iconForList = (t: HouseholdListDTO["type"]) => {
    if (t === "SHOPPING") return <ShoppingCart className="h-4 w-4" />;
    if (t === "MEAL_PREP") return <Utensils className="h-4 w-4" />;
    return <Wrench className="h-4 w-4" />;
  };

  const visibleItems = (activeList?.items ?? []).filter((item) => {
    if (filterMode === "MINE") return item.assigneeId === currentMember.id;
    if (filterMode === "OPEN") return !item.isCompleted;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-stone-500">
            Shared Execution
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
            Shopping, Meal Prep &amp; Household Chores
          </h2>
          <p className="text-sm text-stone-500">
            Collaborative family lists — groceries, Sunday meal prep, lawn
            mowing, and everyday home upkeep with clear ownership.
          </p>
        </div>

        {canCreateList && (
          <button
            onClick={() => setShowNewList((v) => !v)}
            className="domus-btn-primary"
          >
            <Plus className="h-4 w-4" />
            New List
          </button>
        )}
      </div>

      {feedback && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800">
          {feedback}
        </div>
      )}

      <AnimatePresence>
        {showNewList && canCreateList && (
          <motion.form
            initial={{ opacity: 0, y: -10, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.985 }}
            onSubmit={handleCreateList}
            className="domus-card flex flex-wrap items-end gap-3 p-4"
          >
            <div className="min-w-[200px] flex-1">
              <label className="mb-1 block text-xs font-semibold text-stone-600">
                List Name
              </label>
              <input
                required
                value={listTitle}
                onChange={(e) => setListTitle(e.target.value)}
                placeholder="e.g., Weekend Road Trip Packing, Garden Supplies"
                className="domus-input"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-600">
                Type
              </label>
              <select
                value={listType}
                onChange={(e) =>
                  setListType(
                    e.target.value as
                      | "SHOPPING"
                      | "MEAL_PREP"
                      | "CHORES"
                      | "GENERAL"
                  )
                }
                className="domus-input"
              >
                <option value="SHOPPING">Shopping</option>
                <option value="MEAL_PREP">Meal Prep</option>
                <option value="CHORES">Home &amp; Yard Chores</option>
                <option value="GENERAL">General</option>
              </select>
            </div>
            <button type="submit" className="domus-btn-primary">
              Create
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: 2.5D Stacked List Selector */}
        <div className="space-y-3 lg:col-span-4">
          {lists.map((list) => {
            const openCount = list.items.filter((i) => !i.isCompleted).length;
            const selected = activeList?.id === list.id;
            return (
              <motion.button
                key={list.id}
                whileHover={{ y: -3, x: selected ? 0 : 3 }}
                whileTap={{ y: 1, scale: 0.985 }}
                onClick={() => setActiveListId(list.id)}
                className={`flex w-full items-start justify-between rounded-2xl border p-4 text-left transition-all ${
                  selected
                    ? "border-stone-900 bg-gradient-to-b from-stone-800 to-stone-900 text-white"
                    : "border-stone-200 bg-white text-stone-800 hover:border-stone-400"
                }`}
                style={{
                  boxShadow: selected
                    ? "inset 0 1px 0 rgba(255,255,255,0.18), 0 5px 0 0 #0b0a08, 0 16px 26px -10px rgba(25,23,20,0.4)"
                    : "inset 0 1px 0 #fff, 0 3px 0 0 rgba(212,206,192,0.85), 0 8px 18px -10px rgba(25,23,20,0.1)",
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 rounded-xl p-2 ${
                      selected
                        ? "bg-white/15 text-white"
                        : "bg-stone-100 text-stone-700"
                    }`}
                  >
                    {iconForList(list.type)}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{list.title}</p>
                    <p
                      className={`mt-0.5 text-xs ${
                        selected ? "text-stone-300" : "text-stone-500"
                      }`}
                    >
                      {list.description || list.type.replaceAll("_", " ")}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    selected
                      ? "bg-terracotta-500 text-white"
                      : "bg-stone-100 text-stone-700"
                  }`}
                >
                  {openCount}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Right: Active List Workspace */}
        <div className="space-y-4 lg:col-span-8">
          {activeList && (
            <div className="domus-card p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-stone-900">
                    {activeList.title}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {activeList.items.filter((i) => i.isCompleted).length} of{" "}
                    {activeList.items.length} completed
                  </p>
                </div>

                <div className="flex rounded-xl bg-stone-100 p-1 text-xs font-semibold">
                  {(
                    [
                      ["ALL", "All"],
                      ["OPEN", "Open"],
                      ["MINE", "Assigned to Me"],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setFilterMode(key)}
                      className={`relative rounded-lg px-3 py-1 transition ${
                        filterMode === key
                          ? "text-stone-900"
                          : "text-stone-500 hover:text-stone-800"
                      }`}
                    >
                      {filterMode === key && (
                        <motion.span
                          layoutId="list-filter-pill"
                          transition={{
                            type: "spring",
                            stiffness: 420,
                            damping: 30,
                          }}
                          className="absolute inset-0 rounded-lg bg-white shadow-sm"
                        />
                      )}
                      <span className="relative z-10">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick-add form */}
              <form
                onSubmit={handleAddItem}
                className="mb-5 grid gap-2.5 rounded-2xl border border-stone-200/90 bg-stone-50/90 p-3.5 sm:grid-cols-12"
                style={{ boxShadow: "inset 0 2px 5px rgba(25,23,20,0.04)" }}
              >
                <input
                  required
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  placeholder="Add item (e.g., Oat milk, Mow backyard, Chop veggies)..."
                  className="domus-input sm:col-span-5"
                />
                <input
                  value={itemQty}
                  onChange={(e) => setItemQty(e.target.value)}
                  placeholder="Qty / Time"
                  className="domus-input sm:col-span-2"
                />
                <input
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  placeholder="Category"
                  className="domus-input sm:col-span-2"
                />
                <select
                  value={itemAssignee}
                  onChange={(e) => setItemAssignee(e.target.value)}
                  disabled={!canAssignOthers}
                  title={
                    canAssignOthers
                      ? "Assign to family member"
                      : "Your role can only add unassigned/self items"
                  }
                  className="domus-input sm:col-span-3"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <div className="flex items-center justify-between gap-2 sm:col-span-12">
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <span className="font-semibold">Priority:</span>
                    {(["LOW", "MEDIUM", "HIGH"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setItemPriority(p)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                          itemPriority === p
                            ? "bg-stone-900 text-white shadow-sm"
                            : "bg-white text-stone-600 hover:bg-stone-100"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <button type="submit" className="domus-btn-accent py-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Add Item
                  </button>
                </div>
              </form>

              {/* Tactile Animated List Items */}
              <div className="space-y-2.5">
                {visibleItems.length === 0 ? (
                  <p className="py-6 text-center text-xs text-stone-400">
                    No items in this view.
                  </p>
                ) : (
                  <AnimatePresence initial={false}>
                    {visibleItems.map((item) => {
                      const assignee = item.assigneeId
                        ? memberById.get(item.assigneeId)
                        : null;
                      return (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          whileHover={{ y: -2 }}
                          className={`domus-tile flex items-center justify-between gap-3 px-4 py-3 ${
                            item.isCompleted ? "opacity-65" : ""
                          }`}
                        >
                          <button
                            onClick={() => handleToggle(item)}
                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          >
                            <motion.span
                              whileTap={{ scale: 0.78 }}
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 18,
                              }}
                            >
                              {item.isCompleted ? (
                                <CheckCircle2 className="h-5 w-5 shrink-0 text-sage-600" />
                              ) : (
                                <Circle className="h-5 w-5 shrink-0 text-stone-300 transition-colors hover:text-terracotta-500" />
                              )}
                            </motion.span>
                            <div className="min-w-0">
                              <p
                                className={`text-sm font-semibold transition-all ${
                                  item.isCompleted
                                    ? "text-stone-400 line-through"
                                    : "text-stone-900"
                                }`}
                              >
                                {item.title}
                              </p>
                              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-stone-400">
                                <span>{item.category || "General"}</span>
                                {item.quantity && <span>· {item.quantity}</span>}
                                {item.priority === "HIGH" &&
                                  !item.isCompleted && (
                                    <span className="rounded bg-terracotta-100 px-1.5 py-0.2 font-bold text-terracotta-700">
                                      HIGH
                                    </span>
                                  )}
                              </div>
                            </div>
                          </button>

                          <div className="flex shrink-0 items-center gap-2">
                            {assignee && (
                              <span
                                className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm"
                                style={{ backgroundColor: assignee.color }}
                              >
                                {assignee.name}
                              </span>
                            )}
                            {(item.createdById === currentMember.id ||
                              canCreateList) && (
                              <motion.button
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDeleteItem(item.id)}
                                className="rounded-lg p-1 text-stone-400 hover:bg-red-50 hover:text-red-600"
                                title="Delete item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </motion.button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
