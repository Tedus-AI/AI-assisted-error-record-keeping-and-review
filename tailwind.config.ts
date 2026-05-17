import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f8f0dd",
        ink: "#1f2933",
        crayon: {
          blue: "#145bd7",
          light: "#d9ecff",
          green: "#219653",
          orange: "#f2994a",
          red: "#e84a5f",
          purple: "#7d4cc2",
          yellow: "#f2c94c",
        },
      },
      boxShadow: {
        sketch: "4px 5px 0 rgba(20, 91, 215, 0.14)",
        soft: "0 16px 40px rgba(33, 41, 51, 0.08)",
      },
      fontFamily: {
        hand: [
          "\"Comic Sans MS\"",
          "\"Segoe Print\"",
          "\"Noto Sans TC\"",
          "system-ui",
          "sans-serif",
        ],
        sans: ["\"Noto Sans TC\"", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
