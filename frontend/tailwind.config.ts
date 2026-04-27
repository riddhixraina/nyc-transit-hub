import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#112033",
        mist: "#eef5ff",
        tide: "#0d6c7d",
        coral: "#e66b4c",
        sand: "#f5e3b3",
        slate: "#425466",
      },
      fontFamily: {
        display: ['"Space Grotesk"', "sans-serif"],
        body: ['"IBM Plex Sans"', "sans-serif"],
      },
      boxShadow: {
        panel: "0 24px 60px rgba(17, 32, 51, 0.12)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(rgba(17, 32, 51, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(17, 32, 51, 0.06) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
} satisfies Config;
