"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

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

function mapWmoCode(
  code: number,
  isDay: boolean
): {
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
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
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
      label: isDay ? "Sunny" : "Clear Night",
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
 * Framed Miniature House Window showing bold, vivid animated outdoor weather!
 * Clicking opens a quick weather preview switcher (Live Auto / Sunny / Cloudy / Rain / Snow / Night).
 */
export function NavbarWeatherWindow({
  weather,
  overrideKind,
  onSelectOverride,
}: {
  weather: WeatherState;
  overrideKind: WeatherKind | null;
  onSelectOverride: (k: WeatherKind | null) => void;
}) {
  const [open, setOpen] = useState(false);

  const hour = new Date().getHours();
  const isSunrise = hour >= 5 && hour < 9;
  const isSunset = hour >= 17 && hour < 20;

  const skyGradient =
    weather.kind === "sunny"
      ? isSunrise
        ? "linear-gradient(180deg, #60a5fa 0%, #fbbf24 65%, #fb923c 100%)"
        : isSunset
        ? "linear-gradient(180deg, #6366f1 0%, #f97316 62%, #fde047 100%)"
        : "linear-gradient(180deg, #38bdf8 0%, #7dd3fc 65%, #bae6fd 100%)"
      : weather.kind === "clear-night"
      ? "linear-gradient(180deg, #0f172a 0%, #1e1b4b 65%, #312e81 100%)"
      : weather.kind === "cloudy"
      ? "linear-gradient(180deg, #64748b 0%, #94a3b8 60%, #cbd5e1 100%)"
      : weather.kind === "rain"
      ? "linear-gradient(180deg, #334155 0%, #475569 65%, #64748b 100%)"
      : weather.kind === "snow"
      ? "linear-gradient(180deg, #3b82f6 0%, #93c5fd 65%, #e0f2fe 100%)"
      : "linear-gradient(180deg, #1e293b 0%, #334155 65%, #475569 100%)";

  return (
    <div className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Look outside — click to preview Sunny, Rain, Snow, Cloudy or Night"
        className="group flex items-center gap-2.5 rounded-2xl border border-white/85 bg-[#f3ede4]/95 px-2 py-1 shadow-sm transition hover:bg-white"
      >
        {/* Framed Cozy House Window */}
        <div
          className="relative h-9 w-24 overflow-hidden rounded-xl border-[2.5px] border-[#c8b39a] shadow-inner"
          style={{
            background: skyGradient,
            boxShadow:
              "inset 0 2px 6px rgba(0,0,0,0.22), 0 1px 0 rgba(255,255,255,0.8)",
          }}
        >
          {/* SUNNY: Rotating golden rays + cheerful smiling sun! */}
          {weather.kind === "sunny" && (
            <motion.div
              animate={{ y: [2, -2, 2] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {/* Rotating rays */}
              <motion.svg
                viewBox="0 0 48 48"
                className="h-9 w-9"
                animate={{ rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              >
                {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                  <line
                    key={deg}
                    x1="24"
                    y1="4"
                    x2="24"
                    y2="9"
                    stroke="#fef08a"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    transform={`rotate(${deg} 24 24)`}
                  />
                ))}
              </motion.svg>
              {/* Smiling sun face */}
              <svg
                viewBox="0 0 32 32"
                className="absolute h-6 w-6 drop-shadow-sm"
              >
                <circle
                  cx="16"
                  cy="16"
                  r="11"
                  fill="#fbbf24"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                />
                {/* Rosy cheeks */}
                <circle cx="11" cy="17.5" r="1.5" fill="#fb7185" opacity="0.65" />
                <circle cx="21" cy="17.5" r="1.5" fill="#fb7185" opacity="0.65" />
                {/* Happy eyes */}
                <circle cx="12.5" cy="14" r="1.3" fill="#78350f" />
                <circle cx="19.5" cy="14" r="1.3" fill="#78350f" />
                {/* Big smile */}
                <path
                  d="M12.2 18.2 Q16 21.8 19.8 18.2"
                  fill="none"
                  stroke="#78350f"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </motion.div>
          )}

          {/* CLEAR NIGHT: Glowing crescent moon + bold twinkling stars */}
          {weather.kind === "clear-night" && (
            <>
              <motion.svg
                viewBox="0 0 28 28"
                animate={{ rotate: [-6, 6, -6] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute right-2.5 top-1 h-6 w-6 drop-shadow"
              >
                <path
                  d="M18 4a9 9 0 1 0 6 15.6A7.5 7.5 0 0 1 18 4Z"
                  fill="#fde68a"
                />
              </motion.svg>
              {[
                { x: 10, y: 8, d: 0 },
                { x: 24, y: 18, d: 0.4 },
                { x: 38, y: 10, d: 0.8 },
                { x: 52, y: 20, d: 1.2 },
                { x: 16, y: 24, d: 0.6 },
              ].map((s, i) => (
                <motion.span
                  key={i}
                  animate={{ opacity: [0.25, 1, 0.25], scale: [0.7, 1.35, 0.7] }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    delay: s.d,
                  }}
                  className="absolute h-1.5 w-1.5 rounded-full bg-amber-200 shadow-[0_0_6px_#fde68a]"
                  style={{ left: s.x, top: s.y }}
                />
              ))}
            </>
          )}

          {/* CLOUDY: Bold plump drifting clay clouds */}
          {weather.kind === "cloudy" && (
            <>
              <motion.svg
                viewBox="0 0 64 32"
                animate={{ x: [-12, 16, -12] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-1 top-0.5 h-7 w-14 drop-shadow-sm"
              >
                <path
                  d="M16 26h32a10 10 0 0 0 2-19.8A13 13 0 0 0 25 8a9 9 0 0 0-9 18Z"
                  fill="#ffffff"
                />
              </motion.svg>
              <motion.svg
                viewBox="0 0 64 32"
                animate={{ x: [14, -14, 14] }}
                transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                className="absolute right-0 top-2.5 h-6 w-12 opacity-90 drop-shadow-sm"
              >
                <path
                  d="M16 26h32a10 10 0 0 0 2-19.8A13 13 0 0 0 25 8a9 9 0 0 0-9 18Z"
                  fill="#e2e8f0"
                />
              </motion.svg>
            </>
          )}

          {/* RAIN & STORM: Bold raincloud + vivid falling raindrops */}
          {(weather.kind === "rain" || weather.kind === "storm") && (
            <>
              <svg
                viewBox="0 0 80 22"
                className="absolute left-1 top-0 h-5 w-20 drop-shadow"
              >
                <path
                  d="M10 18h60a8 8 0 0 0 0-16 12 12 0 0 0-22-1 13 13 0 0 0-24 2A8 8 0 0 0 10 18Z"
                  fill="#cbd5e1"
                />
              </svg>
              {[8, 18, 28, 38, 48, 58, 68, 78].map((leftPx, i) => (
                <motion.span
                  key={leftPx}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 38, opacity: [0, 1, 1, 0] }}
                  transition={{
                    duration: 0.65 + (i % 3) * 0.12,
                    repeat: Infinity,
                    delay: i * 0.11,
                    ease: "linear",
                  }}
                  className="absolute h-3 w-[2.5px] -rotate-12 rounded-full bg-sky-300 shadow-[0_0_4px_#7dd3fc]"
                  style={{ left: leftPx }}
                />
              ))}
              {weather.kind === "storm" && (
                <motion.svg
                  viewBox="0 0 24 32"
                  animate={{ opacity: [0, 0, 1, 0, 0, 0] }}
                  transition={{ duration: 2.8, repeat: Infinity }}
                  className="absolute left-9 top-2 h-7 w-5"
                >
                  <path d="M13 2 4 17h7l-2 13 11-16h-7l0-12Z" fill="#fde047" />
                </motion.svg>
              )}
            </>
          )}

          {/* SNOW: Bold drifting white snowflakes + cozy snow sill */}
          {weather.kind === "snow" && (
            <>
              {[6, 16, 26, 36, 46, 56, 66, 76, 84].map((leftPx, i) => (
                <motion.span
                  key={leftPx}
                  initial={{ y: -6, opacity: 0 }}
                  animate={{
                    y: 38,
                    x: [0, i % 2 === 0 ? 5 : -5, 0],
                    opacity: [0, 1, 1, 0],
                  }}
                  transition={{
                    duration: 1.9 + (i % 3) * 0.4,
                    repeat: Infinity,
                    delay: i * 0.22,
                    ease: "easeInOut",
                  }}
                  className="absolute h-2 w-2 rounded-full bg-white shadow-[0_0_5px_#ffffff]"
                  style={{ left: leftPx }}
                />
              ))}
              <div className="absolute bottom-0 left-0 right-0 h-2 rounded-t-full bg-white/95" />
            </>
          )}

          {/* Subtle Windowpane Crossbar Mullions */}
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-[1.5px] -translate-x-1/2 bg-[#c8b39a]/75" />
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[1.5px] -translate-y-1/2 bg-[#c8b39a]/65" />
        </div>

        {/* Bold Weather Temp & Condition Label */}
        <div className="pr-1.5 text-left">
          <p className="text-xs font-extrabold leading-tight text-[#1e1916]">
            {weather.tempF !== null ? `${weather.tempF}°F` : weather.label}
          </p>
          <p className="text-[10px] font-bold leading-tight text-[#6b5d53]">
            {weather.tempF !== null ? weather.label : "Outside"}
          </p>
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-56">
          <div className="domus-card space-y-2 p-3 text-[#1e1916] shadow-2xl">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#6b5d53]">
              Window View
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] font-bold">
              {(
                [
                  { id: null, label: "Live Auto" },
                  { id: "sunny", label: "☀️ Sunny" },
                  { id: "cloudy", label: "☁️ Cloudy" },
                  { id: "rain", label: "🌧️ Rain" },
                  { id: "snow", label: "❄️ Snow" },
                  { id: "storm", label: "⛈️ Storm" },
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
      className="hidden items-center gap-2 rounded-2xl border border-white/85 bg-[#f3ede4]/95 px-2.5 py-1.5 shadow-sm md:inline-flex"
      title={now ? now.toLocaleTimeString() : "Wall Clock"}
    >
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
