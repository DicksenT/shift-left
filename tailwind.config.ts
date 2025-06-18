import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
          background: "#0f172a",  // slate-900
            card: "#1e293b",        // slate-800
            text: "#e2e8f0",        // slate-200
            highlight: "#22d3ee",   // cyan-400
            danger: "#ef4444",      // red-500
            warning: "#f59e0b",     // amber-500
            safe: "#10b981",        // green-500
        },
    },
  },
  plugins: [],
} satisfies Config;
