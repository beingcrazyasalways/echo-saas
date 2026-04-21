import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          cyan: "#00f5ff",
          purple: "#bf00ff",
          red: "#ff0055",
          blue: "#0066ff",
        },
        glass: {
          light: "rgba(255, 255, 255, 0.1)",
          dark: "rgba(0, 0, 0, 0.3)",
        },
      },
      boxShadow: {
        "neon-cyan": "0 0 20px rgba(0, 245, 255, 0.5)",
        "neon-purple": "0 0 20px rgba(191, 0, 255, 0.5)",
        "neon-red": "0 0 20px rgba(255, 0, 85, 0.5)",
        "neon-blue": "0 0 20px rgba(0, 102, 255, 0.5)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
export default config;
