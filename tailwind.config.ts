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
        paper: "#FAFAF7",
        surface: "#FFFFFF",
        ink: { DEFAULT: "#111110", 2: "#52524E", 3: "#6E6E68" },
        line: "#E4E4DE",
        accent: { DEFAULT: "#0F7B5F", ink: "#FAFAF7" },
        score: { partial: "#B45309", missing: "#B91C1C" },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      maxWidth: { content: "1120px" },
      boxShadow: { paper: "0 1px 2px rgba(17,17,16,.06)" },
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
