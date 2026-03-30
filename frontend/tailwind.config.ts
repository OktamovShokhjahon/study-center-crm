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
        soft: "0 4px 24px -4px rgba(5, 150, 105, 0.14), 0 8px 20px -8px rgba(13, 148, 136, 0.1)",
        "soft-dark": "0 4px 24px -4px rgba(0, 0, 0, 0.5), 0 0 40px -12px rgba(16, 185, 129, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
