import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
      },
      boxShadow: {
        soft: "0 4px 24px -4px rgba(76, 29, 149, 0.12), 0 8px 16px -8px rgba(76, 29, 149, 0.08)",
        "soft-dark": "0 4px 24px -4px rgba(0, 0, 0, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
