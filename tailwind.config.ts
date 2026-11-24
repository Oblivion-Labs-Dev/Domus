import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        stone: {
          50: "#fafaf8",
          100: "#f4f3ef",
          200: "#e7e5de",
          300: "#d6d3c9",
          400: "#a8a296",
          500: "#787166",
          600: "#57524a",
          700: "#443f39",
          800: "#292622",
          900: "#1c1a17",
        },
        terracotta: {
          50: "#fdf5f2",
          100: "#fbe8e0",
          200: "#f6cfc0",
          500: "#d4633e",
          600: "#ba4d2b",
          700: "#993c20",
        },
        sage: {
          50: "#f3f7f4",
          100: "#e3ede5",
          200: "#c6dbc9",
          500: "#4f7c5b",
          600: "#3d6347",
          700: "#2f4e37",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
