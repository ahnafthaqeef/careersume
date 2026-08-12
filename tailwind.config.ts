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
        // The Highlight palette. Mirrored in globals.css vars and src/lib/theme.ts.
        ground: { DEFAULT: "#FFFFFF", 2: "#F6F6F3" },
        ink: { DEFAULT: "#101010", 2: "#4A4A46", 3: "#6B6B66" },
        line: { DEFAULT: "#E6E6E1", strong: "#101010" },
        mark: "#F2E438",
        // Data truth only, never chrome.
        good: "#1B7F4D",
        warn: "#B45309",
        bad: "#B91C1C",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      maxWidth: { content: "1120px" },
      boxShadow: { sheet: "0 1px 2px rgba(16,16,16,.05)" },
      animation: { "fade-in": "fadeIn 0.25s ease-out", "slide-up": "slideUp 0.25s ease-out" },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { transform: "translateY(8px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
      },
    },
  },
  plugins: [],
};
export default config;
