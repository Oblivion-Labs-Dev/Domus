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
          50: "#f7f2e9",
          100: "#efe7da",
          200: "#dfd4c3",
          300: "#cabba5",
          400: "#9e8e78",
          500: "#736655",
          600: "#544a3d",
          700: "#3e372d",
          800: "#26211c",
          900: "#191512",
        },
        terracotta: {
          50: "#fff3ee",
          100: "#fde2d6",
          200: "#f8c1aa",
          400: "#e6734d",
          500: "#d45a33",
          600: "#b84420",
          700: "#8f3216",
        },
        sage: {
          50: "#eff7f2",
          100: "#d8ece0",
          200: "#b2d9c2",
          400: "#589472",
          500: "#3b6e52",
          600: "#2d5840",
          700: "#204230",
        },
        coastal: {
          50: "#f0f5fa",
          100: "#dce8f4",
          500: "#365578",
          600: "#284260",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      keyframes: {
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.04)" },
        },
      },
      animation: {
        "float-slow": "float-slow 5.5s ease-in-out infinite",
        "pulse-soft": "pulse-soft 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
