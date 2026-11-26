"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Columns2,
  GripVertical,
  LayoutGrid,
  Plus,
  StickyNote,
  Trash2,
} from "lucide-react";

export interface SpaceBlockItem {
  id: string;
  type: string;
  span: 6 | 12; // 6 = Half Width (side-by-side), 12 = Full Width
  title?: string;
  content?: string;
  color?: "butter" | "sage" | "terracotta" | "sky";
}

export interface AvailableBlockOption {
  type: string;
  label: string;
  defaultSpan: 6 | 12;
  allowMultiple?: boolean;
}

interface SpaceBuilderProps {
  blocks: SpaceBlockItem[];
  availableBlocks: AvailableBlockOption[];
  readOnly?: boolean;
  onChangeBlocks: (next: SpaceBlockItem[]) => Promise<void>;
  renderBlock: (block: SpaceBlockItem) => React.ReactNode;
}

const NOTE_BG: Record<string, string> = {
  butter: "bg-amber-50/95 border-amber-300 text-stone-900",
  sage: "bg-sage-50/95 border-sage-300 text-stone-900",
  terracotta: "bg-terracotta-50/95 border-terracotta-300 text-stone-900",
  sky: "bg-sky-50/95 border-sky-300 text-stone-900",
};

export function normalizeSpaceBlocks(
  raw: unknown[],
  fallback: SpaceBlockItem[]
): SpaceBlockItem[] {
  if (!Array.isArray(raw) || raw.length === 0) return fallback;
  return raw.map((item, idx) => {
    if (typeof item === "string") {
      return { id: `blk_${item}_${idx}`, type: item, span: 12 };
    }
    const obj = item as Partial<SpaceBlockItem>;
    return {
      id: obj.id ?? `blk_${idx}`,
      type: obj.type ?? "custom_note",
      span: obj.span === 6 ? 6 : 12,
      title: obj.title,
      content: obj.content,
      color: obj.color,
    };
  });
}

export default function SpaceBuilder({
  blocks,
  availableBlocks,
  readOnly = false,
  onChangeBlocks,
  renderBlock,
}: SpaceBuilderProps) {
  const [arranging, setArranging] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Custom note block composer
  const [addingNote, setAddingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteColor, setNoteColor] = useState<
    "butter" | "sage" | "terracotta" | "sky"
  >("butter");

  async function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }
    const fromIdx = blocks.findIndex((b) => b.id === draggingId);
    const toIdx = blocks.findIndex((b) => b.id === targetId);
    setDraggingId(null);
    setDragOverId(null);
    if (fromIdx < 0 || toIdx < 0) return;

    const next = [...blocks];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    await onChangeBlocks(next);
  }

  async function toggleSpan(id: string) {
    const next: SpaceBlockItem[] = blocks.map((b) =>
      b.id === id ? { ...b, span: b.span === 12 ? 6 : 12 } : b
    );
    await onChangeBlocks(next);
  }

  async function removeBlock(id: string) {
    const next = blocks.filter((b) => b.id !== id);
    await onChangeBlocks(next);
  }

  async function addBlock(opt: AvailableBlockOption) {
    const next: SpaceBlockItem[] = [
      ...blocks,
      {
        id: `blk_${opt.type}_${Math.random().toString(36).slice(2, 6)}`,
        type: opt.type,
        span: opt.defaultSpan,
      },
    ];
    await onChangeBlocks(next);
  }

  async function handleCreateCustomNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteTitle.trim()) return;
    const next: SpaceBlockItem[] = [
      ...blocks,
      {
        id: `blk_note_${Math.random().toString(36).slice(2, 7)}`,
        type: "custom_note",
        span: 6,
        title: noteTitle.trim(),
        content: noteBody.trim(),
        color: noteColor,
      },
    ];
    setNoteTitle("");
    setNoteBody("");
    setAddingNote(false);
    await onChangeBlocks(next);
  }

  const presentTypes = new Set(blocks.map((b) => b.type));
  const addableModules = availableBlocks.filter(
    (opt) => opt.allowMultiple || !presentTypes.has(opt.type)
  );

  return (
    <div className="space-y-4">
      {/* Space Layout Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-stone-200/80 bg-white/75 px-4 py-2.5 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-600">
            <LayoutGrid className="h-4 w-4 text-terracotta-500" />
            <span>
              {arranging
                ? "Drag any block to rearrange, resize Half/Full width, or add new blocks anywhere!"
                : "Your Space Layout — drag blocks, resize columns, or add custom notes anywhere"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAddingNote((v) => !v)}
              className="domus-btn-secondary py-1.5 text-xs"
            >
              <StickyNote className="h-3.5 w-3.5 text-amber-600" />
              + Note Block
            </button>
            <button
              type="button"
              onClick={() => setArranging((v) => !v)}
              className={
                arranging
                  ? "domus-btn-accent py-1.5 text-xs"
                  : "domus-btn-secondary py-1.5 text-xs"
              }
            >
              <Columns2 className="h-3.5 w-3.5" />
              {arranging ? "Done Arranging" : "Arrange / Add Blocks"}
            </button>
          </div>
        </div>
      )}

      {/* Add Custom Freeform Note Block Form */}
      <AnimatePresence>
        {addingNote && !readOnly && (
          <motion.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onSubmit={handleCreateCustomNote}
            className="domus-card grid gap-3 p-4 sm:grid-cols-12"
          >
            <input
              required
              autoFocus
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Note title (e.g., Grocery Ideas, Wi-Fi Password, Goals)..."
              className="domus-input sm:col-span-4"
            />
            <input
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              placeholder="Write anything you want pinned on this page..."
              className="domus-input sm:col-span-5"
            />
            <select
              value={noteColor}
              onChange={(e) =>
                setNoteColor(
                  e.target.value as "butter" | "sage" | "terracotta" | "sky"
                )
              }
              className="domus-input sm:col-span-3"
            >
              <option value="butter">Sticky Yellow</option>
              <option value="sage">Soft Sage</option>
              <option value="terracotta">Clay Coral</option>
              <option value="sky">Calm Sky</option>
            </select>
            <div className="flex justify-end gap-2 sm:col-span-12">
              <button
                type="button"
                onClick={() => setAddingNote(false)}
                className="domus-btn-secondary text-xs"
              >
                Cancel
              </button>
              <button type="submit" className="domus-btn-primary text-xs">
                Place Note on Page
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Add Removed/Extra Module Chips while Arranging */}
      <AnimatePresence>
        {arranging && !readOnly && addableModules.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="domus-card flex flex-wrap items-center gap-2 p-3.5"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Add Block to Space:
            </span>
            {addableModules.map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => addBlock(opt)}
                className="domus-btn-secondary py-1 text-xs"
              >
                <Plus className="h-3 w-3 text-terracotta-500" />
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Responsive 12-Column Drag-and-Drop Modular Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {blocks.map((block) => {
          const isOver = dragOverId === block.id;
          return (
            <motion.div
              key={block.id}
              layout
              draggable={!readOnly}
              onDragStart={() => setDraggingId(block.id)}
              onDragEnd={() => {
                setDraggingId(null);
                setDragOverId(null);
              }}
              onDragOver={(e) => {
                if (readOnly || !draggingId) return;
                e.preventDefault();
                setDragOverId(block.id);
              }}
              onDragLeave={() => {
                if (isOver) setDragOverId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(block.id);
              }}
              className={`relative transition-all ${
                block.span === 6 ? "lg:col-span-6" : "lg:col-span-12"
              } ${
                isOver
                  ? "rounded-3xl ring-2 ring-terracotta-500 ring-offset-2"
                  : ""
              }`}
            >
              {/* Block Arrangement Controls Bar (always accessible when arranging, or subtle grip on hover) */}
              {!readOnly && (
                <div
                  className={`mb-1.5 flex items-center justify-between px-1 transition-opacity ${
                    arranging ? "opacity-100" : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <span className="inline-flex cursor-grab items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-stone-500 active:cursor-grabbing">
                    <GripVertical className="h-3.5 w-3.5" />
                    Drag to Move
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleSpan(block.id)}
                      className="rounded-lg border border-stone-200 bg-white px-2 py-0.5 text-[10px] font-bold text-stone-700 hover:bg-stone-100"
                      title="Toggle Half Width / Full Width"
                    >
                      {block.span === 12 ? "Make Half (1/2)" : "Make Full (2/2)"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBlock(block.id)}
                      className="rounded-lg border border-stone-200 bg-white p-1 text-stone-400 hover:bg-red-50 hover:text-red-600"
                      title="Remove block from space"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Render Custom Freeform Note Block OR Domain Module */}
              {block.type === "custom_note" ? (
                <div
                  className={`domus-card p-5 ${
                    NOTE_BG[block.color ?? "butter"] ?? NOTE_BG.butter
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-amber-700" />
                    <h4 className="text-sm font-bold">{block.title}</h4>
                  </div>
                  {block.content && (
                    <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed opacity-85">
                      {block.content}
                    </p>
                  )}
                </div>
              ) : (
                renderBlock(block)
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
