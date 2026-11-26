"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Upload, X } from "lucide-react";
import { AVATAR_PRESETS } from "@/lib/avatars";
import { DECOR_CATALOG } from "@/lib/decor";
import MemberAvatar from "./MemberAvatar";

interface AvatarEditorModalProps {
  open: boolean;
  initials: string;
  color: string;
  currentAvatarId?: string | null;
  onClose: () => void;
  onSave: (avatarId: string) => Promise<void>;
}

export default function AvatarEditorModal({
  open,
  initials,
  color,
  currentAvatarId,
  onClose,
  onSave,
}: AvatarEditorModalProps) {
  const [selected, setSelected] = useState(currentAvatarId ?? "crown");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 144;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Center-crop square
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setSelected(dataUrl);
      };
      img.onerror = () => setError("Could not read that image file.");
      if (typeof reader.result === "string") {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleConfirm() {
    setSaving(true);
    setError(null);
    try {
      await onSave(selected);
      onClose();
    } catch {
      setError("Could not save avatar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/45 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94 }}
            className="domus-card relative max-h-[88vh] w-full max-w-lg space-y-5 overflow-y-auto bg-white p-6"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-4">
              <MemberAvatar
                initials={initials}
                color={color}
                avatarId={selected}
                size="lg"
              />
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Customize Your Profile Avatar
                </h3>
                <p className="text-xs text-stone-500">
                  Upload your own photo, pick a 2.5D clay icon, or choose an
                  emblem.
                </p>
              </div>
            </div>

            {/* Upload Custom Photo */}
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 p-4 text-center">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="domus-btn-secondary text-xs"
              >
                <Upload className="h-3.5 w-3.5 text-terracotta-500" />
                Upload Your Own Photo
              </button>
              <p className="mt-1.5 text-[11px] text-stone-400">
                Automatically cropped &amp; optimized to a crisp circular avatar
              </p>
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {error}
              </p>
            )}

            {/* Sculpted Emoji Emblems */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Character Emblems
              </p>
              <div className="flex flex-wrap gap-2">
                {AVATAR_PRESETS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setSelected(av.id)}
                    className={`rounded-2xl border p-1.5 transition ${
                      selected === av.id
                        ? "border-stone-900 bg-stone-100"
                        : "border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    <MemberAvatar
                      initials={initials}
                      color={av.ring}
                      avatarId={av.id}
                      size="md"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* 2.5D Miniature Assets as Avatars */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                2.5D Clay Miniatures
              </p>
              <div className="grid grid-cols-5 gap-2">
                {DECOR_CATALOG.slice(0, 15).map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => setSelected(asset.src)}
                    className={`flex flex-col items-center rounded-xl border p-1.5 transition ${
                      selected === asset.src
                        ? "border-terracotta-500 bg-terracotta-50"
                        : "border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset.src}
                      alt={asset.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-stone-100 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="domus-btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleConfirm}
                className="domus-btn-primary text-xs"
              >
                <Camera className="h-3.5 w-3.5" />
                {saving ? "Saving..." : "Save Avatar"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
