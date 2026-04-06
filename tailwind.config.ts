import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        blue: {
          50: "var(--brand-50, #eef3fb)",
          100: "var(--brand-100, #d4e1f5)",
          200: "var(--brand-200, #b0c9ed)",
          300: "var(--brand-300, #84a9e2)",
          400: "var(--brand-400, #5785d5)",
          500: "var(--brand-500, #3366cc)",
          600: "var(--brand-600, #2952a3)",
          700: "var(--brand-700, #1f3d7a)",
          800: "var(--brand-800, #142952)",
          900: "var(--brand-900, #0a1429)",
          950: "var(--brand-950, #050a14)",
        },
        brand: {
          50: "var(--brand-50, #eef3fb)",
          100: "var(--brand-100, #d4e1f5)",
          200: "var(--brand-200, #b0c9ed)",
          300: "var(--brand-300, #84a9e2)",
          400: "var(--brand-400, #5785d5)",
          500: "var(--brand-500, #3366cc)",
          600: "var(--brand-600, #2952a3)",
          700: "var(--brand-700, #1f3d7a)",
          800: "var(--brand-800, #142952)",
          900: "var(--brand-900, #0a1429)",
          950: "var(--brand-950, #050a14)",
          accent: "var(--brand-accent, #facc15)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
