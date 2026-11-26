"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ImagePlus, X } from "lucide-react";
import { DECOR_CATALOG, SHOP_CATEGORIES, ShopCategory } from "@/lib/decor";

interface AssetPickerPopoverProps {
  value: string;
  onChange: (src: string) => void;
  label?: string;
}

export default function AssetPickerPopover({
  value,
  onChange,
  label = "2.5D Icon (optional)",
}: AssetPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState<ShopCategory>("ALL");

  const items = DECOR_CATALOG.filter((a) =>
    cat === "ALL" ? true : a.category === cat
  );

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="domus-btn-secondary flex h-10 items-center gap-2 whitespace-nowrap px-3 text-xs"
        >
          {value ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Selected 2.5D icon"
                className="h-6 w-6 rounded-lg object-cover"
              />
              <span>Change Icon</span>
            </>
          ) : (
            <>
              <ImagePlus className="h-3.5 w-3.5 text-terracotta-500" />
              <span>{label}</span>
            </>
          )}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            title="Clear icon"
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="domus-card absolute left-0 top-12 z-40 w-80 space-y-2.5 bg-white p-3.5 shadow-xl sm:w-96">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Pick a 2.5D Visual Asset
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1">
            {SHOP_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCat(c.id)}
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  cat === c.id
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="grid max-h-52 grid-cols-4 gap-2 overflow-y-auto pr-0.5">
            {items.map((asset) => {
              const active = value === asset.src;
              return (
                <motion.button
                  key={asset.id}
                  type="button"
                  whileHover={{ y: -2, scale: 1.05 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => {
                    onChange(asset.src);
                    setOpen(false);
                  }}
                  className={`flex flex-col items-center rounded-xl border p-1.5 text-center transition ${
                    active
                      ? "border-terracotta-500 bg-terracotta-50"
                      : "border-stone-200 bg-stone-50/70 hover:border-stone-400"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.src}
                    alt={asset.name}
                    className="h-11 w-11 rounded-lg bg-[#faf9f5] object-cover"
                  />
                  <span className="mt-1 line-clamp-1 text-[9px] font-bold text-stone-700">
                    {asset.name}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
