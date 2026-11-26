export type WallPaintId =
  | "plaster"
  | "sage"
  | "terracotta"
  | "linen"
  | "sky"
  | "sandstone";

// Keep alias exported so any existing imports stay compatible
export type GlobalPaletteId = WallPaintId;

export interface WallPaintOption {
  id: WallPaintId;
  name: string;
  description: string;
  swatch: string;
  swatches: [string, string, string];
}

export const WALL_PAINTS: WallPaintOption[] = [
  {
    id: "plaster",
    name: "Sunlit Plaster",
    description: "Warm apricot clay & soft sage wash",
    swatch: "#f3e2d3",
    swatches: ["#f6e3d5", "#efe8df", "#d9eae0"],
  },
  {
    id: "sage",
    name: "Sage Garden",
    description: "Calm botanical eucalyptus walls",
    swatch: "#d6e6db",
    swatches: ["#d2e6d9", "#e5efe7", "#eef2ea"],
  },
  {
    id: "terracotta",
    name: "Warm Terracotta",
    description: "Sunbaked clay & cozy peach plaster",
    swatch: "#f2d6c4",
    swatches: ["#f5d7c4", "#f0e1d4", "#e7cfc0"],
  },
  {
    id: "linen",
    name: "Soft Linen",
    description: "Bright, airy warm alabaster",
    swatch: "#f4efe6",
    swatches: ["#f7f3ec", "#efe9de", "#e7dfd1"],
  },
  {
    id: "sky",
    name: "Morning Sky",
    description: "Dusty coastal blue & warm sand",
    swatch: "#d8e6f3",
    swatches: ["#d4e4f4", "#e7eff7", "#f2ebe2"],
  },
  {
    id: "sandstone",
    name: "Sandstone Dusk",
    description: "Muted rose-sand evening plaster",
    swatch: "#ead9d3",
    swatches: ["#eddcd6", "#e7ddd8", "#dcd4d8"],
  },
];

export const GLOBAL_PALETTES = WALL_PAINTS;
