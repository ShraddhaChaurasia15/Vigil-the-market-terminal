/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: "#090A0F",
          panel: "#12141C",
          border: "#1E2230",
          hover: "#1A1D2A",
          muted: "#64748B",
          text: "#F1F5F9"
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
