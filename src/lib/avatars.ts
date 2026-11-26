export interface AvatarPreset {
  id: string;
  label: string;
  emoji: string;
  gradient: string;
  ring: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: "crown",
    label: "House Leader",
    emoji: "👑",
    gradient: "from-terracotta-400 via-terracotta-500 to-amber-600",
    ring: "#d45a33",
  },
  {
    id: "leaf",
    label: "Botanical",
    emoji: "🌿",
    gradient: "from-emerald-500 via-sage-500 to-teal-700",
    ring: "#3b6e52",
  },
  {
    id: "fox",
    label: "Sunlit Fox",
    emoji: "🦊",
    gradient: "from-orange-400 via-terracotta-500 to-rose-600",
    ring: "#ea580c",
  },
  {
    id: "owl",
    label: "Night Owl",
    emoji: "🦉",
    gradient: "from-slate-600 via-indigo-700 to-slate-900",
    ring: "#365578",
  },
  {
    id: "cat",
    label: "Cozy Cat",
    emoji: "🐱",
    gradient: "from-amber-400 via-orange-400 to-amber-600",
    ring: "#d9932b",
  },
  {
    id: "bear",
    label: "Warm Bear",
    emoji: "🐻",
    gradient: "from-amber-700 via-stone-700 to-stone-900",
    ring: "#78553a",
  },
  {
    id: "panda",
    label: "Chill Panda",
    emoji: "🐼",
    gradient: "from-teal-500 via-emerald-600 to-cyan-800",
    ring: "#0d9488",
  },
  {
    id: "sun",
    label: "Morning Sun",
    emoji: "☀️",
    gradient: "from-yellow-400 via-amber-500 to-orange-500",
    ring: "#eab308",
  },
  {
    id: "music",
    label: "Melody",
    emoji: "🎸",
    gradient: "from-violet-500 via-purple-600 to-indigo-700",
    ring: "#7c3aed",
  },
  {
    id: "compass",
    label: "Explorer",
    emoji: "🧭",
    gradient: "from-sky-500 via-blue-600 to-indigo-700",
    ring: "#2563eb",
  },
];

export function getAvatarPreset(id?: string | null): AvatarPreset | null {
  if (!id) return null;
  return AVATAR_PRESETS.find((a) => a.id === id) ?? null;
}

const KEY_WORDS = [
  "OAK",
  "SAGE",
  "CLAY",
  "HEARTH",
  "CEDAR",
  "SUN",
  "MAPLE",
  "PINE",
  "STONE",
  "AMBER",
];

export function generateRoomKey(): string {
  const w1 = KEY_WORDS[Math.floor(Math.random() * KEY_WORDS.length)];
  const w2 = KEY_WORDS[Math.floor(Math.random() * KEY_WORDS.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${w1}-${w2}-${num}`;
}
