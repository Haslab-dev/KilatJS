/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./example/**/*.{ts,tsx,js,jsx,html}",
        "./src/**/*.{ts,tsx,js,jsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Primary Colors - Deep Purple Gradient Theme
                primary: {
                    50: "#f5f3ff",
                    100: "#ede9fe",
                    200: "#ddd6fe",
                    300: "#c4b5fd",
                    400: "#a78bfa",
                    500: "#8b5cf6",
                    600: "#7c3aed",
                    700: "#6d28d9",
                    800: "#5b21b6",
                    900: "#4c1d95",
                },
                // Accent Colors - Coral/Orange
                accent: {
                    400: "#fb923c",
                    500: "#f97316",
                    600: "#ea580c",
                },
            },
            fontFamily: {
                sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
                mono: ["JetBrains Mono", "Fira Code", "monospace"],
            },
            borderRadius: {
                lg: "16px",
                xl: "24px",
            },
            boxShadow: {
                glow: "0 0 40px -10px var(--tw-shadow-color)",
            },
            animation: {
                "pulse-slow": "pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                blink: "blink 2s ease-in-out infinite",
            },
            keyframes: {
                blink: {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0.3" },
                },
            },
        },
    },
    plugins: [],
};
