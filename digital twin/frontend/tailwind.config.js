/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Inter"', "system-ui", "-apple-system", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      colors: {
        modo: {
          bg: "#0B0E14",
          card: "#131722",
          cardAlt: "#161B28",
          well: "#0E121B",
          input: "#1C2333",
          border: "#232A3B",
          borderLight: "#2D364C",
          blue: "#2563EB",
          blueHover: "#3B82F6",
          blueGlow: "#1D4ED8",
          text: "#F3F6FC",
          muted: "#8B95A7",
          subtle: "#5E6778",
        },
      },
      boxShadow: {
        "modo-card": "0 18px 40px -12px rgba(0, 0, 0, 0.65), inset 0 1px 0 0 rgba(255, 255, 255, 0.04)",
        "modo-btn": "0 4px 14px 0 rgba(37, 99, 235, 0.38), inset 0 1px 0 0 rgba(255, 255, 255, 0.22)",
        "modo-dark-btn": "0 2px 6px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
      },
    },
  },
  plugins: [],
};
