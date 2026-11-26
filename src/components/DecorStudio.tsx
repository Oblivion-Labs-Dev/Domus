"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Palette, Plus, Sparkles, X } from "lucide-react";
import {
  DECOR_CATALOG,
  PlacedDecor,
  ROOM_THEMES,
  RoomThemeId,
} from "@/lib/decor";
import type { RoomConfigDTO } from "./types";

interface DecorStudioProps {
  config: RoomConfigDTO;
  readOnly?: boolean;
  onSave: (patch: Partial<RoomConfigDTO>) => Promise<void>;
}

export default function DecorStudio({
  config,
  readOnly = false,
  onSave,
}: DecorStudioProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(config.roomTitle);
  const [quote, setQuote] = useState(config.bannerQuote);
  const [saving, setSaving] = useState(false);

  const assetById = new Map(DECOR_CATALOG.map((a) => [a.id, a]));

  async function handleAddDecor(assetId: string, defaultLabel: string) {
    if (readOnly) return;
    const next: PlacedDecor[] = [
      ...config.decorItems,
      {
        uid: `d_${Math.random().toString(36).slice(2, 8)}`,
        assetId,
        label: defaultLabel,
      },
    ];
    await onSave({ decorItems: next });
  }

  async function handleRemoveDecor(uid: string) {
    if (readOnly) return;
    const next = config.decorItems.filter((d) => d.uid !== uid);
    await onSave({ decorItems: next });
  }

  async function handleTheme(theme: RoomThemeId) {
    if (readOnly) return;
    await onSave({ theme });
  }

  async function handleSaveMeta(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ roomTitle: title, bannerQuote: quote });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Placed 2.5D Decor Shelf */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <AnimatePresence initial={false}>
            {config.decorItems.map((item) => {
              const asset = assetById.get(item.assetId);
              if (!asset) return null;
              return (
                <motion.div
                  key={item.uid}
                  layout
                  initial={{ opacity: 0, scale: 0.75, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  whileHover={{ y: -5, rotate: -1.5, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 360, damping: 20 }}
                  className="group relative flex items-center gap-2 rounded-2xl border border-stone-200/90 bg-white/95 py-1.5 pl-1.5 pr-3 shadow-sm"
                  style={{
                    boxShadow:
                      "inset 0 1px 0 #fff, 0 3px 0 0 rgba(212,206,192,0.85), 0 10px 18px -10px rgba(25,23,20,0.2)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.src}
                    alt={asset.name}
                    className="h-9 w-9 rounded-xl object-cover"
                  />
                  <span className="text-xs font-bold text-stone-800">
                    {item.label}
                  </span>
                  {!readOnly && (
                    <button
                      onClick={() => handleRemoveDecor(item.uid)}
                      title="Remove decoration"
                      className="ml-0.5 rounded-full p-0.5 text-stone-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {!readOnly && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="domus-btn-secondary whitespace-nowrap text-xs"
          >
            <Palette className="h-3.5 w-3.5 text-terracotta-500" />
            {open ? "Done Decorating" : "Decorate Space"}
          </button>
        )}
      </div>

      {/* Expandable 2.5D Decoration & Theme Studio */}
      <AnimatePresence>
        {open && !readOnly && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.985 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="domus-card space-y-5 p-5 text-stone-900"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-terracotta-500" />
                <h4 className="text-sm font-bold">
                  2.5D Space Studio — Customize Theme &amp; Decor Assets
                </h4>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Wall Theme Selector */}
            <div className="grid gap-5 lg:grid-cols-12">
              <div className="space-y-2.5 lg:col-span-5">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Wall Vibe / Theme
                </p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(ROOM_THEMES) as RoomThemeId[]).map((tid) => {
                    const t = ROOM_THEMES[tid];
                    const active = config.theme === tid;
                    return (
                      <motion.button
                        key={tid}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleTheme(tid)}
                        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                          active
                            ? "border-stone-900 bg-stone-900 text-white shadow-sm"
                            : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                        }`}
                      >
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-black/15"
                          style={{ backgroundColor: t.swatch }}
                        />
                        {t.name}
                      </motion.button>
                    );
                  })}
                </div>

                <form onSubmit={handleSaveMeta} className="space-y-2 pt-2">
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
                      placeholder="Short motto or welcome note..."
                      className="domus-input flex-1 text-xs"
                    />
                    <button
                      type="submit"
                      disabled={saving}
                      className="domus-btn-primary whitespace-nowrap px-3 py-1.5 text-xs"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>

              {/* 2.5D Asset Shelf Picker */}
              <div className="space-y-2.5 lg:col-span-7">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Click Any 2.5D Object to Place in Your Space
                </p>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {DECOR_CATALOG.map((asset) => (
                    <motion.button
                      key={asset.id}
                      type="button"
                      whileHover={{ y: -4, scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleAddDecor(asset.id, asset.name)}
                      className="domus-tile group flex flex-col items-center p-2.5 text-center"
                    >
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={asset.src}
                          alt={asset.name}
                          className="h-14 w-14 rounded-xl object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-stone-900 text-white opacity-0 shadow transition-opacity group-hover:opacity-100">
                          <Plus className="h-3 w-3" />
                        </span>
                      </div>
                      <p className="mt-1.5 text-[11px] font-bold text-stone-800">
                        {asset.name}
                      </p>
                      <p className="line-clamp-1 text-[10px] text-stone-400">
                        {asset.tagline}
                      </p>
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
