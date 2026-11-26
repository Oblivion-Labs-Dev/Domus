"use client";

import { getAvatarPreset } from "@/lib/avatars";

interface MemberAvatarProps {
  initials: string;
  color: string;
  avatarId?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function MemberAvatar({
  initials,
  color,
  avatarId,
  size = "md",
  className = "",
}: MemberAvatarProps) {
  const preset = getAvatarPreset(avatarId);

  const dims =
    size === "sm"
      ? "h-8 w-8 text-xs"
      : size === "lg"
        ? "h-14 w-14 text-xl"
        : "h-10 w-10 text-sm";

  if (preset) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br ${preset.gradient} select-none ${dims} ${className}`}
        style={{
          boxShadow: `0 3px 0 0 ${preset.ring}88, 0 8px 16px -5px ${preset.ring}66`,
        }}
      >
        <span className="drop-shadow-sm">{preset.emoji}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full border-2 border-white font-bold text-white select-none ${dims} ${className}`}
      style={{
        backgroundColor: color,
        boxShadow: `0 3px 0 0 ${color}88, 0 8px 16px -5px ${color}66`,
      }}
    >
      {initials}
    </div>
  );
}
