import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#08080d",
        panel: "#0f0f18",
        red: "#ff2b4a",
        blue: "#00e5ff",
        yellow: "#ffd400",
        magenta: "#ff00c8",
      },
    },
  },
  plugins: [],
};

export default config;
