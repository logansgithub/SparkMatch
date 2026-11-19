/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#121214",
        surface: "#1A1A1E",
        surfaceHover: "#222228",
        coral: "#FF5C38",
        amberWarm: "#F59E0B",
        inkLight: "#F5F4F0",
        inkMuted: "#A1A1AA",
      },
      fontFamily: {
        display: ["Syne", "sans-serif"],
        sans: ["Plus Jakarta Sans", "sans-serif"],
      },
      boxShadow: {
        editorial: "0 8px 32px rgba(0, 0, 0, 0.36)",
        "editorial-sm": "0 4px 16px rgba(0, 0, 0, 0.28)",
      },
    },
  },
  plugins: [],
};
