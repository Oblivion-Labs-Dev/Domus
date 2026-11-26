"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, Move, Palette, Plus, Sparkles, X } from "lucide-react";
import {
  DECOR_CATALOG,
  PlacedDecor,
  ROOM_THEMES,
  RoomThemeId,
  SHOP_CATEGORIES,
  ShopCategory,
} from "@/lib/decor";
import type { RoomConfigDTO } from "./types";

interface FreeformDecorCanvasProps {
  config: RoomConfigDTO;
  readOnly?: boolean;
  onSave: (patch: Partial<RoomConfigDTO>) => Promise<void>;
  children: React.ReactNode;
}

export default function FreeformDecorCanvas({
  config,
  readOnly = false,
  onSave,
  children,
}: FreeformDecorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [editMode, setEditMode] = useState(false);
  const [category, setCategory] = useState<ShopCategory>("ALL");
  const [title, setTitle] = useState(config.roomTitle);
  const [quote, setQuote] = useState(config.bannerQuote);

  const assetById = new Map(DECOR_CATALOG.map((a) => [a.id, a]));
  const theme = ROOM_THEMES[config.theme ?? "stone"] ?? ROOM_THEMES.stone;

  const filteredAssets = DECOR_CATALOG.filter((a) =>
    category === "ALL" ? true : a.category === category
  );

  async function handleDropAsset(assetId: string, name: string) {
    if (readOnly) return;
    // Place near center-right with slight random offset so multiple drops don't stack identically
    const x = Math.round(58 + Math.random() * 26);
    const y = Math.round(14 + Math.random() * 48);
    const next: PlacedDecor[] = [
      ...config.decorItems,
      {
        uid: `d_${Math.random().toString(36).slice(2, 8)}`,
        assetId,
        label: name,
        x,
        y,
        scale: 1,
      },
    ];
    await onSave({ decorItems: next });
  }

  async function handleDragEnd(
    uid: string,
    clientX: number,
    clientY: number
  ) {
    if (readOnly || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const rawX = ((clientX - rect.left - 32) / rect.width) * 100;
    const rawY = ((clientY - rect.top - 32) / rect.height) * 100;
    const x = Math.max(2, Math.min(88, Math.round(rawX)));
    const y = Math.max(4, Math.min(80, Math.round(rawY)));

    const next = config.decorItems.map((item) =>
      item.uid === uid ? { ...item, x, y } : item
    );
    await onSave({ decorItems: next });
  }

  async function handleCycleScale(uid: string) {
    if (readOnly) return;
    const next = config.decorItems.map((item) => {
      if (item.uid !== uid) return item;
      const cur = item.scale ?? 1;
      const nextScale = cur < 1 ? 1 : cur === 1 ? 1.3 : 0.78;
      return { ...item, scale: nextScale };
    });
    await onSave({ decorItems: next });
  }

  async function handleRemove(uid: string) {
    if (readOnly) return;
    const next = config.decorItems.filter((d) => d.uid !== uid);
    await onSave({ decorItems: next });
  }

  return (
    <div className="space-y-3">
      {/* Freeform Decoratable Architectural Canvas */}
      <div
        ref={containerRef}
        className={`relative min-h-[210px] overflow-hidden rounded-3xl border bg-gradient-to-br p-6 transition-all ${theme.surfaceClass} ${
          editMode ? "ring-2 ring-terracotta-400 ring-offset-2" : ""
        }`}
        style={{
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 0 0 rgba(202,187,165,0.85), 0 18px 36px -16px rgba(25,21,18,0.16)",
        }}
      >
        {/* Main Space Content */}
        <div className="relative z-10">{children}</div>

        {/* Freeform Draggable 2.5D Objects Placed Anywhere on the Canvas! */}
        {config.decorItems.map((item, idx) => {
          const asset = assetById.get(item.assetId);
          if (!asset) return null;
          const x = item.x ?? Math.min(82, 62 + idx * 12);
          const y = item.y ?? Math.min(68, 16 + (idx % 2) * 32);
          const scale = item.scale ?? 1;
          const pxSize = Math.round(64 * scale);

          return (
            <motion.div
              key={item.uid}
              drag={editMode && !readOnly}
              dragMomentum={false}
              dragConstraints={containerRef}
              onDragEnd={(_, info) => {
                if (editMode) {
                  handleDragEnd(item.uid, info.point.x, info.point.y);
                }
              }}
              whileHover={{ scale: 1.08, rotate: editMode ? 0 : -2 }}
              style={{
                position: "absolute",
                left: `${x}%`,
                top: `${y}%`,
                zIndex: editMode ? 30 : 20,
              }}
              className={`group select-none ${
                editMode
                  ? "cursor-grab rounded-2xl border-2 border-dashed border-terracotta-400 bg-white/70 p-1 shadow-lg active:cursor-grabbing"
                  : "pointer-events-auto"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset.src}
                alt={item.label}
                draggable={false}
                style={{ width: pxSize, height: pxSize }}
                className="rounded-2xl bg-[#faf9f5]/90 object-cover shadow-md"
              />

              {editMode && !readOnly && (
                <div className="absolute -right-2 -top-2 flex items-center gap-0.5 rounded-full bg-stone-900 p-0.5 text-white shadow">
                  <button
                    type="button"
                    onClick={() => handleCycleScale(item.uid)}
                    title="Resize (S / M / L)"
                    className="rounded-full p-1 hover:bg-white/20"
                  >
                    <Maximize2 className="h-2.5 w-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.uid)}
                    title="Remove"
                    className="rounded-full p-1 hover:bg-red-500"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Bottom-right Customize Canvas Trigger */}
        {!readOnly && (
          <div className="relative z-20 mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-black/5 pt-3.5">
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                theme.dark ? "text-stone-300" : "text-stone-500"
              }`}
            >
              <Move className="h-3.5 w-3.5 text-terracotta-500" />
              {editMode
                ? "Drag any 2.5D object anywhere on this space canvas! Click resize or X to adjust."
                : "Customize this wall with themes & drag-anywhere 2.5D objects"}
            </span>
            <button
              type="button"
              onClick={() => setEditMode((v) => !v)}
              className={
                editMode
                  ? "domus-btn-accent whitespace-nowrap py-1.5 text-xs"
                  : "domus-btn-secondary whitespace-nowrap py-1.5 text-xs"
              }
            >
              <Palette className="h-3.5 w-3.5" />
              {editMode ? "Done Arranging" : "Customize & Place Decor"}
            </button>
          </div>
        )}
      </div>

      {/* Contextual Decoration & Theme Bar (only open while arranging) */}
      <AnimatePresence>
        {editMode && !readOnly && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.985 }}
            className="domus-card space-y-4 p-5 text-stone-900"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-terracotta-500" />
                <h4 className="text-sm font-bold">
                  Drop 2.5D Objects Anywhere + Pick Wall Theme
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="domus-btn-secondary px-3 py-1 text-xs"
              >
                Close
              </button>
            </div>

            <div className="grid gap-5 lg:grid-cols-12">
              <div className="space-y-3 lg:col-span-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  Wall Theme
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(ROOM_THEMES) as RoomThemeId[]).map((tid) => {
                    const t = ROOM_THEMES[tid];
                    const active = config.theme === tid;
                    return (
                      <button
                        key={tid}
                        type="button"
                        onClick={() => onSave({ theme: tid })}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold ${
                          active
                            ? "border-stone-900 bg-stone-900 text-white"
                            : "border-stone-200 bg-white text-stone-700"
                        }`}
                      >
                        <span
                          className="h-3 w-3 rounded-full border border-black/15"
                          style={{ backgroundColor: t.swatch }}
                        />
                        {t.name}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2 pt-1">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Space title..."
                    className="domus-input text-xs"
                  />
                  <div className="flex gap-2">
                    <input
                      value={quote}
                      onChange={(e) => setQuote(e.target.value)}
                      placeholder="Short motto..."
                      className="domus-input flex-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onSave({ roomTitle: title, bannerQuote: quote })
                      }
                      className="domus-btn-primary px-3 py-1.5 text-xs"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 lg:col-span-8">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    Click to Drop onto Canvas (Then Drag Anywhere!)
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {SHOP_CATEGORIES.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategory(c.id)}
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          category === c.id
                            ? "bg-stone-900 text-white"
                            : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid max-h-52 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-5">
                  {filteredAssets.map((asset) => (
                    <motion.button
                      key={asset.id}
                      type="button"
                      whileHover={{ y: -3, scale: 1.04 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDropAsset(asset.id, asset.name)}
                      className="domus-tile group flex flex-col items-center p-2 text-center"
                    >
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={asset.src}
                          alt={asset.name}
                          className="h-12 w-12 rounded-xl bg-[#faf9f5] object-cover"
                        />
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-terracotta-500 text-white opacity-0 transition group-hover:opacity-100">
                          <Plus className="h-2.5 w-2.5" />
                        </span>
                      </div>
                      <span className="mt-1 line-clamp-1 text-[10px] font-bold text-stone-700">
                        {asset.name}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
