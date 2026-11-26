export type ShopCategory =
  | "ALL"
  | "COZY"
  | "PLANTS_PETS"
  | "FITNESS_DIET"
  | "HOME_GEAR"
  | "STUDY_MUSIC";

export interface DecorAsset {
  id: string;
  name: string;
  category: Exclude<ShopCategory, "ALL">;
  src: string;
  tagline: string;
}

export const SHOP_CATEGORIES: Array<{ id: ShopCategory; label: string }> = [
  { id: "ALL", label: "All Items" },
  { id: "COZY", label: "Cozy Room" },
  { id: "PLANTS_PETS", label: "Plants & Pets" },
  { id: "FITNESS_DIET", label: "Fitness & Diet" },
  { id: "HOME_GEAR", label: "Home & Gear" },
  { id: "STUDY_MUSIC", label: "Study & Music" },
];

export const DECOR_CATALOG: DecorAsset[] = [
  // Cozy Room
  {
    id: "decor-armchair",
    name: "Lounge Armchair",
    category: "COZY",
    src: "/assets/decor-armchair.png",
    tagline: "Plush terracotta reading chair",
  },
  {
    id: "decor-lamp",
    name: "Studio Lamp",
    category: "COZY",
    src: "/assets/decor-lamp.png",
    tagline: "Warm mid-century desk glow",
  },
  {
    id: "decor-coffee",
    name: "Morning Coffee",
    category: "COZY",
    src: "/assets/decor-coffee.png",
    tagline: "Ceramic mug & pour-over",
  },
  {
    id: "decor-bookshelf",
    name: "Oak Bookshelf",
    category: "COZY",
    src: "/assets/decor-bookshelf.png",
    tagline: "Books & tiny shelf succulent",
  },
  {
    id: "board-3d",
    name: "Mini Pinboard",
    category: "COZY",
    src: "/assets/board-3d.png",
    tagline: "Corkboard with pastel stickies",
  },

  // Plants & Pets
  {
    id: "decor-plant",
    name: "Monstera Pot",
    category: "PLANTS_PETS",
    src: "/assets/decor-plant.png",
    tagline: "Terracotta indoor greenery",
  },
  {
    id: "decor-cat",
    name: "Sleeping Cat",
    category: "PLANTS_PETS",
    src: "/assets/decor-cat.png",
    tagline: "Cozy cat curled on a cushion",
  },

  // Fitness & Diet
  {
    id: "decor-yoga",
    name: "Yoga Corner",
    category: "FITNESS_DIET",
    src: "/assets/decor-yoga.png",
    tagline: "Rolled mat, bottle & dumbbell",
  },
  {
    id: "decor-weights",
    name: "Home Gym Set",
    category: "FITNESS_DIET",
    src: "/assets/decor-weights.png",
    tagline: "Kettlebell, dumbbells & rope",
  },
  {
    id: "decor-salad",
    name: "Meal Prep Bowl",
    category: "FITNESS_DIET",
    src: "/assets/decor-salad.png",
    tagline: "Fresh greens, avocado & grains",
  },
  {
    id: "decor-blender",
    name: "Smoothie Blender",
    category: "FITNESS_DIET",
    src: "/assets/decor-blender.png",
    tagline: "Berry nutrition station",
  },
  {
    id: "decor-bike",
    name: "Cruiser Bike",
    category: "FITNESS_DIET",
    src: "/assets/decor-bike.png",
    tagline: "Sage cruiser with basket",
  },

  // Home & Gear
  {
    id: "decor-car",
    name: "Family SUV",
    category: "HOME_GEAR",
    src: "/assets/decor-car.png",
    tagline: "Driving lessons & errands",
  },
  {
    id: "decor-mower",
    name: "Lawn Mower",
    category: "HOME_GEAR",
    src: "/assets/decor-mower.png",
    tagline: "Yard & lawn care station",
  },
  {
    id: "decor-groceries",
    name: "Market Tote",
    category: "HOME_GEAR",
    src: "/assets/decor-groceries.png",
    tagline: "Fresh produce & groceries",
  },
  {
    id: "decor-toolbox",
    name: "Repair Toolbox",
    category: "HOME_GEAR",
    src: "/assets/decor-toolbox.png",
    tagline: "DIY home maintenance kit",
  },
  {
    id: "calendar-3d",
    name: "Desk Calendar",
    category: "HOME_GEAR",
    src: "/assets/calendar-3d.png",
    tagline: "Daily rhythm keeper",
  },

  // Study & Music
  {
    id: "decor-desk",
    name: "Oak Study Desk",
    category: "STUDY_MUSIC",
    src: "/assets/decor-desk.png",
    tagline: "Laptop, notebook & cup",
  },
  {
    id: "decor-vinyl",
    name: "Vinyl Player",
    category: "STUDY_MUSIC",
    src: "/assets/decor-vinyl.png",
    tagline: "Warm wood turntable vibes",
  },
  {
    id: "decor-guitar",
    name: "Acoustic Guitar",
    category: "STUDY_MUSIC",
    src: "/assets/decor-guitar.png",
    tagline: "Music corner centerpiece",
  },
];

export interface PlacedDecor {
  uid: string;
  assetId: string;
  label: string;
}

export type RoomThemeId = "stone" | "sage" | "terracotta" | "butter" | "midnight";

export const ROOM_THEMES: Record<
  RoomThemeId,
  {
    name: string;
    surfaceClass: string;
    accentRing: string;
    swatch: string;
    dark?: boolean;
  }
> = {
  stone: {
    name: "Warm Stone",
    surfaceClass:
      "from-stone-50 via-white to-stone-100/90 border-stone-200/90 text-stone-900",
    accentRing: "ring-stone-300",
    swatch: "#e6e2d8",
  },
  sage: {
    name: "Sunlit Sage",
    surfaceClass:
      "from-sage-50 via-white to-sage-100/70 border-sage-200/90 text-stone-900",
    accentRing: "ring-sage-300",
    swatch: "#c2dec8",
  },
  terracotta: {
    name: "Terracotta Clay",
    surfaceClass:
      "from-terracotta-50 via-white to-orange-50/70 border-terracotta-200/90 text-stone-900",
    accentRing: "ring-terracotta-300",
    swatch: "#f9cfc0",
  },
  butter: {
    name: "Morning Sun",
    surfaceClass:
      "from-amber-50/90 via-white to-yellow-50/70 border-amber-200/90 text-stone-900",
    accentRing: "ring-amber-300",
    swatch: "#fde68a",
  },
  midnight: {
    name: "Midnight Studio",
    surfaceClass:
      "from-stone-900 via-stone-800 to-stone-900 border-stone-700 text-stone-100",
    accentRing: "ring-stone-500",
    swatch: "#282520",
    dark: true,
  },
};

export type NoteColorId = "cream" | "butter" | "terracotta" | "sage" | "sky";

export const NOTE_COLORS: Record<
  NoteColorId,
  {
    name: string;
    cardClass: string;
    edgeShadow: string;
    swatch: string;
  }
> = {
  cream: {
    name: "Warm Cream",
    cardClass: "bg-white border-stone-200/90",
    edgeShadow: "0 3px 0 0 rgba(212,206,192,0.9)",
    swatch: "#faf9f5",
  },
  butter: {
    name: "Sticky Yellow",
    cardClass: "bg-amber-50/95 border-amber-200/90",
    edgeShadow: "0 3px 0 0 rgba(245,208,110,0.9)",
    swatch: "#fef3c7",
  },
  terracotta: {
    name: "Clay Coral",
    cardClass: "bg-terracotta-50/95 border-terracotta-200/90",
    edgeShadow: "0 3px 0 0 rgba(240,180,158,0.9)",
    swatch: "#fde9e1",
  },
  sage: {
    name: "Soft Sage",
    cardClass: "bg-sage-50/95 border-sage-200/90",
    edgeShadow: "0 3px 0 0 rgba(176,210,184,0.9)",
    swatch: "#e1efe4",
  },
  sky: {
    name: "Calm Sky",
    cardClass: "bg-sky-50/95 border-sky-200/90",
    edgeShadow: "0 3px 0 0 rgba(166,210,240,0.9)",
    swatch: "#e0f2fe",
  },
};
