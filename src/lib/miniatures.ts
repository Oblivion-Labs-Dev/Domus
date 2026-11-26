export interface ClayMiniature {
  id: string;
  label: string;
  src: string;
  group: "Home" | "Kitchen" | "Wellness" | "Study & Fun";
}

export const CLAY_MINIATURES: ClayMiniature[] = [
  { id: "groceries", label: "Groceries", src: "/assets/decor-groceries.png", group: "Kitchen" },
  { id: "salad", label: "Meal Prep", src: "/assets/decor-salad.png", group: "Kitchen" },
  { id: "coffee", label: "Coffee", src: "/assets/decor-coffee.png", group: "Kitchen" },
  { id: "blender", label: "Smoothies", src: "/assets/decor-blender.png", group: "Kitchen" },

  { id: "weights", label: "Workout", src: "/assets/decor-weights.png", group: "Wellness" },
  { id: "yoga", label: "Yoga", src: "/assets/decor-yoga.png", group: "Wellness" },
  { id: "bike", label: "Cycling", src: "/assets/decor-bike.png", group: "Wellness" },
  { id: "plant", label: "Garden", src: "/assets/decor-plant.png", group: "Wellness" },

  { id: "car", label: "Errands", src: "/assets/decor-car.png", group: "Home" },
  { id: "toolbox", label: "Home Care", src: "/assets/decor-toolbox.png", group: "Home" },
  { id: "mower", label: "Yard Work", src: "/assets/decor-mower.png", group: "Home" },
  { id: "cat", label: "Pets", src: "/assets/decor-cat.png", group: "Home" },
  { id: "armchair", label: "Lounge", src: "/assets/decor-armchair.png", group: "Home" },
  { id: "lamp", label: "Evening", src: "/assets/decor-lamp.png", group: "Home" },

  { id: "desk", label: "Work / Study", src: "/assets/decor-desk.png", group: "Study & Fun" },
  { id: "bookshelf", label: "Reading", src: "/assets/decor-bookshelf.png", group: "Study & Fun" },
  { id: "guitar", label: "Music", src: "/assets/decor-guitar.png", group: "Study & Fun" },
  { id: "vinyl", label: "Relax", src: "/assets/decor-vinyl.png", group: "Study & Fun" },
  { id: "board", label: "General", src: "/assets/board-3d.png", group: "Study & Fun" },
  { id: "calendar", label: "Schedule", src: "/assets/calendar-3d.png", group: "Study & Fun" },
];

export function getMiniatureByIdOrSrc(value?: string | null): ClayMiniature | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  const byId = CLAY_MINIATURES.find((m) => m.id === lower);
  if (byId) return byId;
  const bySrc = CLAY_MINIATURES.find((m) => m.src === value);
  if (bySrc) return bySrc;
  if (lower === "shopping") return CLAY_MINIATURES[0];
  if (lower === "meal_prep") return CLAY_MINIATURES[1];
  if (lower === "chores") return CLAY_MINIATURES.find((m) => m.id === "toolbox") ?? null;
  if (lower === "exercise") return CLAY_MINIATURES.find((m) => m.id === "weights") ?? null;
  if (lower === "diet") return CLAY_MINIATURES.find((m) => m.id === "salad") ?? null;
  if (lower === "life_plan" || lower === "life plan") {
    return CLAY_MINIATURES.find((m) => m.id === "bookshelf") ?? null;
  }
  return null;
}
