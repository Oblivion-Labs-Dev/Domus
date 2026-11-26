"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Moon,
  Sun,
} from "lucide-react";

export type WeatherKind =
  | "sunny"
  | "clear-night"
  | "cloudy"
  | "rain"
  | "snow"
  | "storm";

export interface WeatherState {
  kind: WeatherKind;
  tempF: number | null;
  label: string;
  isLive: boolean;
}

function mapWmoCode(code: number, isDay: boolean): {
  kind: WeatherKind;
  label: string;
} {
  if (code === 0 || code === 1) {
    return isDay
      ? { kind: "sunny", label: "Sunny" }
      : { kind: "clear-night", label: "Clear Night" };
  }
  if (code === 2 || code === 3 || code === 45 || code === 48) {
    return { kind: "cloudy", label: code >= 45 ? "Foggy" : "Cloudy" };
  }
  if (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82)
  ) {
    return { kind: "rain", label: "Rainy" };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return { kind: "snow", label: "Snowy" };
  }
  if (code >= 95) {
    return { kind: "storm", label: "Stormy" };
  }
  return isDay
    ? { kind: "sunny", label: "Clear" }
    : { kind: "clear-night", label: "Clear Night" };
}

export function useLocalWeather() {
  const [liveWeather, setLiveWeather] = useState<WeatherState>(() => {
    const hour = new Date().getHours();
    const isDay = hour >= 6 && hour < 19;
    return {
      kind: isDay ? "sunny" : "clear-night",
      tempF: null,
      label: isDay ? "Clear" : "Clear Night",
      isLive: false,
    };
  });
  const [overrideKind, setOverrideKind] = useState<WeatherKind | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchForCoords(lat: number, lon: number) {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,weather_code,is_day&temperature_unit=fahrenheit`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        const cur = data?.current;
        if (!cur || cancelled) return;
        const mapped = mapWmoCode(
          Number(cur.weather_code ?? 0),
          Number(cur.is_day ?? 1) === 1
        );
        setLiveWeather({
          kind: mapped.kind,
          tempF: Math.round(Number(cur.temperature_2m)),
          label: mapped.label,
          isLive: true,
        });
      } catch {
        // Offline or blocked — gracefully keep local time-of-day fallback
      }
    }

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          void fetchForCoords(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // Graceful fallback if user declines location permission
          void fetchForCoords(37.7749, -122.4194);
        },
        { timeout: 6000, maximumAge: 600000 }
      );
    } else {
      void fetchForCoords(37.7749, -122.4194);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const activeKind = overrideKind ?? liveWeather.kind;
  const activeLabel = overrideKind
    ? {
        sunny: "Sunny",
        "clear-night": "Clear Night",
        cloudy: "Cloudy",
        rain: "Rainy",
        snow: "Snowy",
        storm: "Stormy",
      }[overrideKind]
    : liveWeather.label;

  return {
    weather: {
      ...liveWeather,
      kind: activeKind,
      label: activeLabel,
    },
    overrideKind,
    setOverrideKind,
  };
}

/**
 * Subtle, atmospheric animated weather overlay inside the frosted glass navbar.
 */
export function NavbarWeatherBackdrop({ kind }: { kind: WeatherKind }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* SUNNY: warm drifting sunbeams */}
      {kind === "sunny" && (
        <>
          <motion.div
            animate={{ opacity: [0.35, 0.65, 0.35], scale: [1, 1.08, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-12 -top-16 h-44 w-64 rounded-full blur-2xl"
            style={{
              background:
                "radial-gradient(circle, rgba(251, 191, 36, 0.38) 0%, rgba(251, 146, 60, 0.14) 55%, transparent 75%)",
            }}
          />
          <motion.div
            animate={{ x: [0, 18, 0], opacity: [0.18, 0.35, 0.18] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-1/3 -top-10 h-32 w-56 rounded-full blur-2xl"
            style={{
              background:
                "radial-gradient(circle, rgba(253, 224, 71, 0.28) 0%, transparent 72%)",
            }}
          />
        </>
      )}

      {/* CLEAR NIGHT: soft twilight tint + twinkling stars */}
      {kind === "clear-night" && (
        <>
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(30, 41, 59, 0.08) 0%, rgba(49, 46, 129, 0.1) 50%, rgba(30, 41, 59, 0.08) 100%)",
            }}
          />
          {[12, 24, 38, 52, 67, 79, 91].map((leftPct, i) => (
            <motion.span
              key={leftPct}
              animate={{ opacity: [0.2, 0.9, 0.2], scale: [0.8, 1.25, 0.8] }}
              transition={{
                duration: 2.2 + (i % 3) * 0.7,
                repeat: Infinity,
                delay: i * 0.3,
              }}
              className="absolute h-1.5 w-1.5 rounded-full bg-amber-400/80"
              style={{
                left: `${leftPct}%`,
                top: `${18 + (i % 3) * 22}%`,
              }}
            />
          ))}
        </>
      )}

      {/* CLOUDY: drifting soft clouds */}
      {kind === "cloudy" && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ x: `${i * 35 - 10}%` }}
              animate={{ x: [`${i * 35 - 15}%`, `${i * 35 + 15}%`, `${i * 35 - 15}%`] }}
              transition={{
                duration: 16 + i * 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute top-1 h-14 w-48 rounded-full bg-slate-300/30 blur-xl"
              style={{ left: `${i * 26}%` }}
            />
          ))}
        </>
      )}

      {/* RAIN & STORM: delicate falling raindrops */}
      {(kind === "rain" || kind === "storm") && (
        <>
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(148, 163, 184, 0.12), rgba(100, 116, 139, 0.14))",
            }}
          />
          {Array.from({ length: 18 }).map((_, i) => (
            <motion.span
              key={i}
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 76, opacity: [0, 0.75, 0] }}
              transition={{
                duration: 0.9 + (i % 4) * 0.18,
                repeat: Infinity,
                delay: (i * 0.13) % 1.4,
                ease: "linear",
              }}
              className="absolute h-3.5 w-[1.5px] -rotate-12 rounded-full bg-sky-500/60"
              style={{ left: `${4 + i * 5.3}%` }}
            />
          ))}
          {kind === "storm" && (
            <motion.div
              animate={{ opacity: [0, 0, 0.35, 0, 0, 0] }}
              transition={{ duration: 5.5, repeat: Infinity }}
              className="absolute inset-0 bg-amber-100/60"
            />
          )}
        </>
      )}

      {/* SNOW: softly drifting snowflakes */}
      {kind === "snow" && (
        <>
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(224, 242, 254, 0.25), rgba(241, 245, 249, 0.25))",
            }}
          />
          {Array.from({ length: 16 }).map((_, i) => (
            <motion.span
              key={i}
              initial={{ y: -10, x: 0, opacity: 0 }}
              animate={{
                y: 74,
                x: [0, i % 2 === 0 ? 10 : -10, 0],
                opacity: [0, 0.95, 0],
              }}
              transition={{
                duration: 3.2 + (i % 4) * 0.6,
                repeat: Infinity,
                delay: (i * 0.24) % 3,
                ease: "easeInOut",
              }}
              className="absolute h-2 w-2 rounded-full bg-white shadow-sm ring-1 ring-sky-200/70"
              style={{ left: `${3 + i * 6}%` }}
            />
          ))}
        </>
      )}
    </div>
  );
}

/**
 * Miniature Clay Analog Wall Clock + Live Digital Time.
 */
export function NavbarWallClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hours = now ? now.getHours() % 12 : 10;
  const minutes = now ? now.getMinutes() : 10;
  const seconds = now ? now.getSeconds() : 0;

  const hourAngle = hours * 30 + minutes * 0.5;
  const minuteAngle = minutes * 6 + seconds * 0.1;
  const secondAngle = seconds * 6;

  const timeString = now
    ? now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : "--:--";

  return (
    <div
      className="hidden items-center gap-2 rounded-2xl border border-white/80 bg-[#f3ede4]/90 px-2.5 py-1 shadow-sm md:inline-flex"
      title={now ? now.toLocaleTimeString() : "Wall Clock"}
    >
      {/* Tactile Analog Wall Clock SVG */}
      <svg
        viewBox="0 0 36 36"
        className="h-7 w-7 shrink-0 drop-shadow-sm"
        aria-hidden="true"
      >
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="#faf7f2"
          stroke="#d8cab8"
          strokeWidth="2.2"
        />
        {/* 12, 3, 6, 9 subtle hour ticks */}
        {[0, 90, 180, 270].map((deg) => (
          <line
            key={deg}
            x1="18"
            y1="4.5"
            x2="18"
            y2="6.8"
            stroke="#9a8b7d"
            strokeWidth="1.5"
            strokeLinecap="round"
            transform={`rotate(${deg} 18 18)`}
          />
        ))}
        {/* Hour hand */}
        <line
          x1="18"
          y1="18"
          x2="18"
          y2="10"
          stroke="#1e1916"
          strokeWidth="2.2"
          strokeLinecap="round"
          transform={`rotate(${hourAngle} 18 18)`}
        />
        {/* Minute hand */}
        <line
          x1="18"
          y1="18"
          x2="18"
          y2="7"
          stroke="#4e433b"
          strokeWidth="1.6"
          strokeLinecap="round"
          transform={`rotate(${minuteAngle} 18 18)`}
        />
        {/* Second hand */}
        <line
          x1="18"
          y1="20"
          x2="18"
          y2="6.5"
          stroke="#e05d38"
          strokeWidth="1"
          strokeLinecap="round"
          transform={`rotate(${secondAngle} 18 18)`}
        />
        <circle cx="18" cy="18" r="1.8" fill="#e05d38" />
      </svg>

      <span className="font-mono text-xs font-extrabold tracking-tight text-[#1e1916]">
        {timeString}
      </span>
    </div>
  );
}

/**
 * Compact Live Weather Badge (click to preview Sunny/Cloudy/Rain/Snow/Night or return to Live).
 */
export function NavbarWeatherPill({
  weather,
  overrideKind,
  onSelectOverride,
}: {
  weather: WeatherState;
  overrideKind: WeatherKind | null;
  onSelectOverride: (k: WeatherKind | null) => void;
}) {
  const [open, setOpen] = useState(false);

  const icon =
    weather.kind === "sunny" ? (
      <Sun className="h-3.5 w-3.5 text-amber-500" />
    ) : weather.kind === "clear-night" ? (
      <Moon className="h-3.5 w-3.5 text-indigo-500" />
    ) : weather.kind === "cloudy" ? (
      <Cloud className="h-3.5 w-3.5 text-slate-500" />
    ) : weather.kind === "rain" ? (
      <CloudRain className="h-3.5 w-3.5 text-sky-600" />
    ) : weather.kind === "snow" ? (
      <CloudSnow className="h-3.5 w-3.5 text-sky-400" />
    ) : (
      <CloudLightning className="h-3.5 w-3.5 text-amber-600" />
    );

  return (
    <div className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Live local weather outside — click to preview animations"
        className="inline-flex items-center gap-1.5 rounded-2xl border border-white/80 bg-[#f3ede4]/90 px-2.5 py-1.5 text-xs font-bold text-[#1e1916] shadow-sm transition hover:bg-white"
      >
        {icon}
        {weather.tempF !== null && <span>{weather.tempF}°F</span>}
        <span className="hidden text-[11px] font-semibold text-[#6b5d53] lg:inline">
          {weather.label}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-56">
          <div className="domus-card space-y-2 p-3 text-[#1e1916] shadow-2xl">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#6b5d53]">
              Outside Weather
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] font-bold">
              {(
                [
                  { id: null, label: "Live Auto" },
                  { id: "sunny", label: "☀️ Sunny" },
                  { id: "cloudy", label: "☁️ Cloudy" },
                  { id: "rain", label: "🌧️ Rain" },
                  { id: "snow", label: "❄️ Snow" },
                  { id: "clear-night", label: "🌙 Night" },
                ] as Array<{ id: WeatherKind | null; label: string }>
              ).map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => {
                    onSelectOverride(opt.id);
                    setOpen(false);
                  }}
                  className={`rounded-xl px-2 py-1.5 text-left transition ${
                    overrideKind === opt.id
                      ? "bg-[#1f332b] text-white"
                      : "bg-[#f3ede4] text-[#4e433b] hover:bg-[#e8dfd3]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
