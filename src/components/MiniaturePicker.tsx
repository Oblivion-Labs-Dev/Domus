"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { CLAY_MINIATURES, ClayMiniature } from "@/lib/miniatures";

interface MiniaturePickerProps {
  value: string; // miniature.id or miniature.src
  onSelect: (miniature: ClayMiniature) => void;
  label?: string;
  compactCount?: number;
}

export default function MiniaturePicker({
  value,
  onSelect,
  label = "Choose a 2.5D Icon (Optional)",
  compactCount = 7,
}: MiniaturePickerProps) {
  const [expanded, setExpanded] = useState(false);

  const visible = expanded
    ? CLAY_MINIATURES
    : CLAY_MINIATURES.slice(0, compactCount);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-[#6b5d53]">{label}</p>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 text-[10px] font-bold text-terracotta-600 hover:underline"
        >
          {expanded ? (
            <>
              Show less <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              All {CLAY_MINIATURES.length} icons{" "}
              <ChevronDown className="h-3 w-3" />
            </>
          )}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {visible.map((m) => {
          const selected = value === m.id || value === m.src;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelect(m)}
              className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition ${
                selected
                  ? "border-[#1f332b] bg-[#1f332b] text-white shadow-sm"
                  : "border-transparent bg-[#f3ede4] text-[#5c5047] hover:bg-[#eae0d3]"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.src}
                alt={m.label}
                className="h-4 w-4 rounded object-contain"
              />
              {m.label}
              {selected && <Check className="h-3 w-3" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
