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
          50: "#faf9f5",
          100: "#f3f1ea",
          200: "#e6e2d8",
          300: "#d4cec0",
          400: "#a8a193",
          500: "#787164",
          600: "#575248",
          700: "#423e36",
          800: "#282520",
          900: "#191714",
        },
        terracotta: {
          50: "#fef6f3",
          100: "#fde9e1",
          200: "#f9cfc0",
          400: "#e4805d",
          500: "#d4633e",
          600: "#ba4d2b",
          700: "#943a1f",
        },
        sage: {
          50: "#f3f8f4",
          100: "#e1efe4",
          200: "#c2dec8",
          400: "#6ca079",
          500: "#4f7c5b",
          600: "#3c6447",
          700: "#2c4c35",
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
        "float-delayed": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-11px)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.04)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "float-slow": "float-slow 5.5s ease-in-out infinite",
        "float-delayed": "float-delayed 6.8s ease-in-out infinite 1.2s",
        "pulse-soft": "pulse-soft 6s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
