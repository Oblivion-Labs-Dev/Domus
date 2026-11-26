"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ImagePlus, Paintbrush, RotateCcw, Sparkles, X } from "lucide-react";
import {
  DEFAULT_WALL_PAINT,
  WALL_PAINT_PRESETS,
  WALL_PATTERNS,
  WallPaintConfig,
  WallPatternId,
} from "@/lib/wallPaint";

interface WallPaintModalProps {
  open: boolean;
  config: WallPaintConfig;
  onChange: (next: WallPaintConfig) => void;
  onClose: () => void;
}

export default function WallPaintModal({
  open,
  config,
  onChange,
  onClose,
}: WallPaintModalProps) {
  const [tab, setTab] = useState<"PAINTS" | "CUSTOM" | "UPLOAD">("PAINTS");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === "string" ? reader.result : null;
      if (!src) return;
      // Resize large photos to keep localStorage fast & safe
      const img = new Image();
      img.onload = () => {
        const maxDim = 1600;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
          onChange({
            ...config,
            mode: "IMAGE",
            imageDataUrl: dataUrl,
          });
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d1714]/40 p-4 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="domus-card relative w-full max-w-lg space-y-5 p-6 sm:p-7"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close wall paint studio"
              className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-[#efe7dc] text-[#5c5047] transition hover:bg-[#e5d9ca]"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 pr-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/paint-bucket-3d.png"
                alt="Wall Paint Bucket"
                className="h-12 w-12 shrink-0 object-contain"
              />
              <div>
                <h3 className="text-base font-extrabold text-[#1e1916]">
                  House Wall Paint &amp; Wallpaper
                </h3>
                <p className="text-xs text-[#6b5d53]">
                  Paint the walls, mix custom colors, add wallpaper patterns, or
                  upload your own background.
                </p>
              </div>
            </div>

            {/* 3 Clean Studio Tabs */}
            <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-[#efe7dc] p-1 text-xs font-bold">
              {(
                [
                  {
                    id: "PAINTS",
                    label: "Wall Paints",
                    icon: <Paintbrush className="h-3.5 w-3.5" />,
                  },
                  {
                    id: "CUSTOM",
                    label: "Mix Colors",
                    icon: <Sparkles className="h-3.5 w-3.5" />,
                  },
                  {
                    id: "UPLOAD",
                    label: "Upload Photo",
                    icon: <ImagePlus className="h-3.5 w-3.5" />,
                  },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 transition ${
                    tab === t.id
                      ? "bg-[#1f332b] text-white shadow-sm"
                      : "text-[#5c5047] hover:text-[#1e1916]"
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {/* TAB 1: 12 CURATED WALL PAINTS */}
            {tab === "PAINTS" && (
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {WALL_PAINT_PRESETS.map((p) => {
                  const active =
                    config.mode === "PRESET" && config.presetId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        onChange({ ...config, mode: "PRESET", presetId: p.id })
                      }
                      className={`group flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 text-center transition ${
                        active
                          ? "border-terracotta-500 bg-terracotta-50/70 shadow-sm"
                          : "border-transparent bg-[#f3ede4] hover:bg-[#eae0d3]"
                      }`}
                    >
                      <div
                        className="relative flex h-10 w-full items-center justify-center rounded-xl border border-white/80 shadow-inner"
                        style={{ background: p.gradient }}
                      >
                        {active && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1f332b] text-white">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold leading-tight text-[#1e1916]">
                        {p.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* TAB 2: CUSTOM DUAL-COLOR MIXER */}
            {tab === "CUSTOM" && (
              <div className="space-y-4 rounded-2xl bg-[#f3ede4] p-4">
                <p className="text-xs font-semibold text-[#574c44]">
                  Pick any two shades to create your own wall gradient (pick the
                  same color twice for a solid flat paint).
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1.5 text-xs font-bold text-[#4e433b]">
                    Top-Left Shade
                    <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2">
                      <input
                        type="color"
                        value={config.customColor1}
                        onChange={(e) =>
                          onChange({
                            ...config,
                            mode: "CUSTOM",
                            customColor1: e.target.value,
                          })
                        }
                        className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent"
                      />
                      <span className="font-mono text-xs text-[#5c5047]">
                        {config.customColor1.toUpperCase()}
                      </span>
                    </div>
                  </label>

                  <label className="flex flex-col gap-1.5 text-xs font-bold text-[#4e433b]">
                    Bottom-Right Shade
                    <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2">
                      <input
                        type="color"
                        value={config.customColor2}
                        onChange={(e) =>
                          onChange({
                            ...config,
                            mode: "CUSTOM",
                            customColor2: e.target.value,
                          })
                        }
                        className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent"
                      />
                      <span className="font-mono text-xs text-[#5c5047]">
                        {config.customColor2.toUpperCase()}
                      </span>
                    </div>
                  </label>
                </div>

                <div
                  className="h-14 w-full rounded-2xl border-2 border-white shadow-inner"
                  style={{
                    background: `linear-gradient(135deg, ${config.customColor1} 0%, ${config.customColor2} 100%)`,
                  }}
                />
              </div>
            )}

            {/* TAB 3: UPLOAD CUSTOM WALLPAPER BACKGROUND */}
            {tab === "UPLOAD" && (
              <div className="space-y-4 rounded-2xl bg-[#f3ede4] p-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#cbbba8] bg-white/70 px-4 py-6 text-center transition hover:border-terracotta-500 hover:bg-white"
                >
                  <ImagePlus className="h-6 w-6 text-terracotta-500" />
                  <span className="text-xs font-bold text-[#1e1916]">
                    Click to upload a wall background or photo
                  </span>
                  <span className="text-[11px] text-[#6b5d53]">
                    PNG, JPG, or WebP · Saved right on your device
                  </span>
                </button>

                {config.imageDataUrl && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[#4e433b]">
                      <span>Soft Wash Overlay (for readability)</span>
                      <span>{Math.round(config.imageWash * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={65}
                      value={Math.round(config.imageWash * 100)}
                      onChange={(e) =>
                        onChange({
                          ...config,
                          mode: "IMAGE",
                          imageWash: Number(e.target.value) / 100,
                        })
                      }
                      className="w-full accent-terracotta-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* WALLPAPER PATTERN OVERLAY (applies to Wall Paints & Custom Colors) */}
            {config.mode !== "IMAGE" && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b5d53]">
                  Wallpaper Pattern
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {WALL_PATTERNS.map((pat) => {
                    const active = config.pattern === pat.id;
                    return (
                      <button
                        key={pat.id}
                        type="button"
                        onClick={() =>
                          onChange({
                            ...config,
                            pattern: pat.id as WallPatternId,
                          })
                        }
                        className={`rounded-xl border px-2.5 py-2 text-xs font-bold transition ${
                          active
                            ? "border-terracotta-500 bg-terracotta-50 text-[#1e1916]"
                            : "border-transparent bg-[#f3ede4] text-[#5c5047] hover:bg-[#eae0d3]"
                        }`}
                      >
                        {pat.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[#e8dfd3] pt-3">
              <button
                type="button"
                onClick={() => onChange(DEFAULT_WALL_PAINT)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6b5d53] hover:text-[#1e1916]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Default
              </button>
              <button
                type="button"
                onClick={onClose}
                className="domus-btn-accent px-5 py-2 text-xs"
              >
                Done Painting
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
