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
  const dims =
    size === "sm"
      ? "h-8 w-8 text-xs"
      : size === "lg"
        ? "h-14 w-14 text-xl"
        : "h-10 w-10 text-sm";

  // Custom uploaded photo OR 2.5D asset path
  if (
    avatarId &&
    (avatarId.startsWith("data:image/") || avatarId.startsWith("/assets/"))
  ) {
    return (
      <div
        className={`shrink-0 overflow-hidden rounded-full border-2 border-white bg-[#faf9f5] select-none ${dims} ${className}`}
        style={{
          boxShadow: `0 3px 0 0 ${color}66, 0 8px 16px -5px rgba(25,21,18,0.25)`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarId}
          alt={initials}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const preset = getAvatarPreset(avatarId);

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
