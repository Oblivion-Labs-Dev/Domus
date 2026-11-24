"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  lift?: number;
  glowColor?: string;
}

export default function TiltCard({
  children,
  className = "",
  maxTilt = 6,
  lift = 5,
  glowColor = "rgba(212, 99, 62, 0.14)",
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    const rotateY = (px - 0.5) * (maxTilt * 2);
    const rotateX = (0.5 - py) * (maxTilt * 2);

    setTilt({ rotateX, rotateY });
    setGlare({ x: px * 100, y: py * 100, opacity: 1 });
  }

  function handleMouseLeave() {
    setTilt({ rotateX: 0, rotateY: 0 });
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  }

  return (
    <div style={{ perspective: 1000 }} className="h-full">
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{
          rotateX: tilt.rotateX,
          rotateY: tilt.rotateY,
          y: glare.opacity ? -lift : 0,
        }}
        transition={{ type: "spring", stiffness: 320, damping: 24, mass: 0.6 }}
        style={{ transformStyle: "preserve-3d" }}
        className={`domus-card relative h-full overflow-hidden ${className}`}
      >
        {/* Specular 2.5D surface sheen */}
        <div
          className="pointer-events-none absolute inset-0 z-10 rounded-2xl transition-opacity duration-300"
          style={{
            opacity: glare.opacity,
            background: `radial-gradient(280px circle at ${glare.x}% ${glare.y}%, ${glowColor}, transparent 68%)`,
          }}
        />
        <div
          className="relative z-20 h-full"
          style={{ transform: "translateZ(12px)" }}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}
