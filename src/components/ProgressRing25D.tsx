"use client";

import { motion } from "framer-motion";

interface ProgressRing25DProps {
  percent: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}

export default function ProgressRing25D({
  percent,
  color,
  size = 54,
  strokeWidth = 6,
}: ProgressRing25DProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative flex shrink-0 items-center justify-center rounded-full bg-stone-50"
      style={{
        width: size,
        height: size,
        boxShadow:
          "inset 0 2px 5px rgba(25,23,20,0.08), 0 3px 0 0 rgba(212,206,192,0.7)",
      }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e6e2d8"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: "spring", stiffness: 110, damping: 18 }}
          style={{
            filter: `drop-shadow(0 2px 4px ${color}55)`,
          }}
        />
      </svg>
      <span className="absolute text-[11px] font-bold text-stone-800">
        {clamped}%
      </span>
    </div>
  );
}
