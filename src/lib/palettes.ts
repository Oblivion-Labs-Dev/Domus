export type GlobalPaletteId = "botanical" | "midnight" | "coastal" | "espresso";

export interface GlobalPalette {
  id: GlobalPaletteId;
  name: string;
  tagline: string;
  swatches: [string, string, string];
  isDark?: boolean;
}

export const GLOBAL_PALETTES: GlobalPalette[] = [
  {
    id: "botanical",
    name: "Forest & Clay",
    tagline: "Lush eucalyptus backdrop, deep forest ink & burnt terracotta",
    swatches: ["#d8eae0", "#1c4536", "#d9532f"],
  },
  {
    id: "midnight",
    name: "Midnight Studio",
    tagline: "Deep slate-indigo night mode with glowing coral & emerald",
    swatches: ["#0f172a", "#1e293b", "#f97316"],
    isDark: true,
  },
  {
    id: "coastal",
    name: "Coastal Indigo",
    tagline: "Crisp coastal mist, deep navy headers & warm golden ochre",
    swatches: ["#dce7f3", "#1b365d", "#d97706"],
  },
  {
    id: "espresso",
    name: "Espresso & Amber",
    tagline: "Rich warm sandstone, deep roast espresso & terracotta clay",
    swatches: ["#e9dfd0", "#291e18", "#c94c24"],
  },
];
