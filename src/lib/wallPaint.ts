export type WallPatternId =
  | "none"
  | "linen"
  | "arches"
  | "stripes"
  | "herringbone"
  | "grid";

export interface WallPaintPreset {
  id: string;
  name: string;
  swatch: string;
  base: string;
  gradient: string;
}

export interface WallPaintConfig {
  mode: "PRESET" | "CUSTOM" | "IMAGE";
  presetId: string;
  customColor1: string;
  customColor2: string;
  pattern: WallPatternId;
  imageDataUrl: string | null;
  imageWash: number; // 0 - 0.65
}

export const WALL_PAINT_PRESETS: WallPaintPreset[] = [
  {
    id: "plaster",
    name: "Sunlit Plaster",
    swatch: "#f2dfd0",
    base: "#efe6dc",
    gradient: "linear-gradient(135deg, #f6e3d5 0%, #efe8df 48%, #d9eae0 100%)",
  },
  {
    id: "sage",
    name: "Sage Garden",
    swatch: "#cde2d4",
    base: "#dce8df",
    gradient: "linear-gradient(135deg, #d2e6d9 0%, #e5efe7 52%, #eef2ea 100%)",
  },
  {
    id: "terracotta",
    name: "Warm Terracotta",
    swatch: "#f0ccb5",
    base: "#eed7c7",
    gradient: "linear-gradient(135deg, #f5d7c4 0%, #f0e1d4 50%, #e7cfc0 100%)",
  },
  {
    id: "linen",
    name: "Soft Linen",
    swatch: "#f3ede2",
    base: "#efe9de",
    gradient: "linear-gradient(135deg, #f7f3ec 0%, #efe9de 52%, #e7dfd1 100%)",
  },
  {
    id: "sky",
    name: "Morning Sky",
    swatch: "#cfe0f2",
    base: "#dde9f4",
    gradient: "linear-gradient(135deg, #d4e4f4 0%, #e7eff7 52%, #f2ebe2 100%)",
  },
  {
    id: "sandstone",
    name: "Sandstone Dusk",
    swatch: "#e8d5cf",
    base: "#e7dad6",
    gradient: "linear-gradient(135deg, #eddcd6 0%, #e7ddd8 50%, #dcd4d8 100%)",
  },
  {
    id: "ochre",
    name: "Honey Ochre",
    swatch: "#f4dfad",
    base: "#f2e5c6",
    gradient: "linear-gradient(135deg, #f7e6bd 0%, #f3ebd6 52%, #eadcc4 100%)",
  },
  {
    id: "lavender",
    name: "Lavender Mist",
    swatch: "#dfd7ee",
    base: "#e5dff0",
    gradient: "linear-gradient(135deg, #e2daf2 0%, #ece7f5 52%, #f2e8e4 100%)",
  },
  {
    id: "olive",
    name: "Olive Grove",
    swatch: "#d6dec2",
    base: "#dfe5cf",
    gradient: "linear-gradient(135deg, #d9e1c7 0%, #e7ebd9 52%, #eee9dc 100%)",
  },
  {
    id: "blush",
    name: "Blush Clay",
    swatch: "#f3d4d4",
    base: "#f0dcdc",
    gradient: "linear-gradient(135deg, #f6d8d8 0%, #f3e4e0 52%, #efe4d8 100%)",
  },
  {
    id: "slate",
    name: "Coastal Slate",
    swatch: "#cbd7e0",
    base: "#d4dfe7",
    gradient: "linear-gradient(135deg, #cdd9e3 0%, #dfe7ee 52%, #e9e4dc 100%)",
  },
  {
    id: "matcha",
    name: "Matcha Cream",
    swatch: "#d4e6cf",
    base: "#e0ecd9",
    gradient: "linear-gradient(135deg, #d6e8d1 0%, #eaf0e2 52%, #f5efe2 100%)",
  },
];

export const WALL_PATTERNS: Array<{
  id: WallPatternId;
  label: string;
  cssImage: string;
  cssSize: string;
}> = [
  {
    id: "none",
    label: "Smooth Plaster",
    cssImage: "none",
    cssSize: "auto",
  },
  {
    id: "linen",
    label: "Linen Weave",
    cssImage:
      "repeating-linear-gradient(0deg, rgba(60,45,35,0.03) 0px, rgba(60,45,35,0.03) 1px, transparent 1px, transparent 6px), repeating-linear-gradient(90deg, rgba(60,45,35,0.03) 0px, rgba(60,45,35,0.03) 1px, transparent 1px, transparent 6px)",
    cssSize: "12px 12px",
  },
  {
    id: "arches",
    label: "Clay Arches",
    cssImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 60 C0 26.86 26.86 0 60 0 M0 30 C16.57 30 30 43.43 30 60' fill='none' stroke='%235c4636' stroke-opacity='0.07' stroke-width='1.5'/%3E%3C/svg%3E")`,
    cssSize: "60px 60px",
  },
  {
    id: "stripes",
    label: "Warm Stripes",
    cssImage:
      "repeating-linear-gradient(90deg, rgba(80,58,42,0.04) 0px, rgba(80,58,42,0.04) 18px, transparent 18px, transparent 36px)",
    cssSize: "36px 36px",
  },
  {
    id: "herringbone",
    label: "Herringbone",
    cssImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20 L20 0 L40 20 M0 40 L20 20 L40 40' fill='none' stroke='%235c4636' stroke-opacity='0.065' stroke-width='1.5'/%3E%3C/svg%3E")`,
    cssSize: "40px 40px",
  },
  {
    id: "grid",
    label: "Atelier Grid",
    cssImage:
      "linear-gradient(rgba(74,56,42,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(74,56,42,0.05) 1px, transparent 1px)",
    cssSize: "32px 32px",
  },
];

export const DEFAULT_WALL_PAINT: WallPaintConfig = {
  mode: "PRESET",
  presetId: "plaster",
  customColor1: "#f6e3d5",
  customColor2: "#d9eae0",
  pattern: "none",
  imageDataUrl: null,
  imageWash: 0.25,
};

const STORAGE_KEY = "domus_wall_paint_v2";

export function loadWallPaintConfig(): WallPaintConfig {
  if (typeof window === "undefined") return DEFAULT_WALL_PAINT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WALL_PAINT;
    const parsed = JSON.parse(raw) as Partial<WallPaintConfig>;
    return {
      ...DEFAULT_WALL_PAINT,
      ...parsed,
    };
  } catch {
    return DEFAULT_WALL_PAINT;
  }
}

export function saveAndApplyWallPaint(config: WallPaintConfig): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore storage quota errors
  }
  applyWallPaintToDocument(config);
}

export function applyWallPaintToDocument(config: WallPaintConfig): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const body = document.body;
  const isDark = root.classList.contains("dark");

  const patternDef =
    WALL_PATTERNS.find((p) => p.id === config.pattern) ?? WALL_PATTERNS[0];

  if (config.mode === "IMAGE" && config.imageDataUrl) {
    const wash = isDark
      ? Math.max(0.62, Math.min(0.82, config.imageWash + 0.4))
      : Math.max(0, Math.min(0.65, config.imageWash));
    const overlay = isDark
      ? `linear-gradient(rgba(18, 15, 13, ${wash}), rgba(18, 15, 13, ${wash}))`
      : `linear-gradient(rgba(250, 246, 240, ${wash}), rgba(250, 246, 240, ${wash}))`;
    body.style.backgroundColor = isDark ? "#131110" : "#efe6dc";
    body.style.backgroundImage = `${overlay}, url("${config.imageDataUrl}")`;
    body.style.backgroundSize = "cover, cover";
    body.style.backgroundPosition = "center, center";
    body.style.backgroundRepeat = "no-repeat, no-repeat";
    body.style.backgroundAttachment = "fixed, fixed";
    return;
  }

  // In Night Mode, dim any wall paint into a cozy nocturnal architectural wash
  if (isDark) {
    const darkPresetMap: Record<string, { base: string; grad: string }> = {
      plaster: {
        base: "#141110",
        grad: "linear-gradient(135deg, #1d1613 0%, #141211 50%, #121a16 100%)",
      },
      sage: {
        base: "#101714",
        grad: "linear-gradient(135deg, #121e18 0%, #111815 52%, #151b18 100%)",
      },
      terracotta: {
        base: "#191210",
        grad: "linear-gradient(135deg, #251713 0%, #1a1311 52%, #171211 100%)",
      },
      linen: {
        base: "#151412",
        grad: "linear-gradient(135deg, #1c1a17 0%, #151412 52%, #121110 100%)",
      },
      sky: {
        base: "#0f151d",
        grad: "linear-gradient(135deg, #121c28 0%, #111720 52%, #171514 100%)",
      },
      sandstone: {
        base: "#171314",
        grad: "linear-gradient(135deg, #21181a 0%, #181416 52%, #141318 100%)",
      },
      ochre: {
        base: "#18150f",
        grad: "linear-gradient(135deg, #241d12 0%, #191611 52%, #161411 100%)",
      },
      lavender: {
        base: "#15131c",
        grad: "linear-gradient(135deg, #1e1929 0%, #16141d 52%, #191516 100%)",
      },
      olive: {
        base: "#141711",
        grad: "linear-gradient(135deg, #1c2116 0%, #151812 52%, #171612 100%)",
      },
      blush: {
        base: "#1a1314",
        grad: "linear-gradient(135deg, #26181a 0%, #1b1515 52%, #181513 100%)",
      },
      slate: {
        base: "#11161b",
        grad: "linear-gradient(135deg, #161e26 0%, #13181d 52%, #161616 100%)",
      },
      matcha: {
        base: "#121813",
        grad: "linear-gradient(135deg, #172318 0%, #131914 52%, #181713 100%)",
      },
    };

    const night =
      config.mode === "CUSTOM"
        ? {
            base: "#141211",
            grad: `linear-gradient(rgba(16, 14, 12, 0.84), rgba(16, 14, 12, 0.88)), linear-gradient(135deg, ${config.customColor1} 0%, ${config.customColor2} 100%)`,
          }
        : darkPresetMap[config.presetId] ?? darkPresetMap.plaster;

    root.style.setProperty("--domus-bg-base", night.base);
    root.style.setProperty("--domus-bg-grad", night.grad);
    body.style.backgroundColor = night.base;
    body.style.backgroundImage = night.grad;
    body.style.backgroundSize = "cover";
    body.style.backgroundRepeat = "no-repeat";
    body.style.backgroundAttachment = "fixed";
    return;
  }

  let base = "#efe6dc";
  let grad =
    "linear-gradient(135deg, #f6e3d5 0%, #efe8df 48%, #d9eae0 100%)";

  if (config.mode === "CUSTOM") {
    base = config.customColor1;
    grad = `linear-gradient(135deg, ${config.customColor1} 0%, ${config.customColor2} 100%)`;
  } else {
    const preset =
      WALL_PAINT_PRESETS.find((p) => p.id === config.presetId) ??
      WALL_PAINT_PRESETS[0];
    base = preset.base;
    grad = preset.gradient;
  }

  root.style.setProperty("--domus-bg-base", base);
  root.style.setProperty("--domus-bg-grad", grad);

  if (patternDef.cssImage !== "none") {
    body.style.backgroundColor = base;
    body.style.backgroundImage = `${patternDef.cssImage}, ${grad}`;
    body.style.backgroundSize = `${patternDef.cssSize}, cover`;
    body.style.backgroundRepeat = "repeat, no-repeat";
    body.style.backgroundAttachment = "fixed, fixed";
  } else {
    body.style.backgroundColor = base;
    body.style.backgroundImage = grad;
    body.style.backgroundSize = "cover";
    body.style.backgroundRepeat = "no-repeat";
    body.style.backgroundAttachment = "fixed";
  }
}
