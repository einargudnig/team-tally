/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Surfaces
        surface: "#0f0f14",
        card: "#1a1a24",
        "card-alt": "#22222e",

        // Primary (amber)
        primary: {
          DEFAULT: "#f59e0b",
          light: "#fbbf24",
          dim: "#b45309",
          muted: "rgba(245,158,11,0.15)",
        },

        // Semantic
        success: "#10b981",
        danger: "#ef4444",

        // Text
        "text-primary": "#f5f5f5",
        "text-secondary": "#9ca3af",
        "text-muted": "#8b8fa3",

        // Borders
        border: "#2a2a36",
      },
    },
  },
  plugins: [],
};
