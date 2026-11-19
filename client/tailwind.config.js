/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FFF8EE",
        ink: "#1A1826",
        coral: "#FF5A5F",
        marigold: "#FFB703",
        indigoParty: "#4F46E5",
        mint: "#10B981",
      },
      fontFamily: {
        display: ['"Space Grotesk"', "sans-serif"],
        sans: ['"DM Sans"', "sans-serif"],
      },
      boxShadow: {
        riso: "4px 4px 0px #1A1826",
        "riso-sm": "2px 2px 0px #1A1826",
        "riso-lg": "6px 6px 0px #1A1826",
      },
    },
  },
  plugins: [],
};
