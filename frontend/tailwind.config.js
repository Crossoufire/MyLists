/** @type {import("tailwindcss").Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        "./pages/**/*.{js,jsx}",
        "./components/**/*.{js,jsx}",
        "./app/**/*.{js,jsx}",
        "./src/**/*.{js,jsx}",
    ],
    prefix: "",
    theme: {
        container: {
            center: "true",
            padding: "0.5rem",
            screens: {
                xs: "490px",
                sm: "640px",
                md: "768px",
                lg: "1025px",
                xl: "1320px",
                "2xl": "1400px"
            }
        },
        screens: {
            xs: "490px",
            sm: "640px",
            md: "768px",
            lg: "1025px",
            xl: "1320px",
            "2xl": "1400px"
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))"
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))"
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))"
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))"
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))"
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))"
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))"
                },
                "color-1": "hsl(var(--color-1))",
                "color-2": "hsl(var(--color-2))",
                "color-3": "hsl(var(--color-3))",
                "color-4": "hsl(var(--color-4))",
                "color-5": "hsl(var(--color-5))",
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)"
            },
            keyframes: {
                "accordion-down": {
                    from: {
                        height: "0"
                    },
                    to: {
                        height: "var(--radix-accordion-content-height)"
                    }
                },
                "accordion-up": {
                    from: {
                        height: "var(--radix-accordion-content-height)"
                    },
                    to: {
                        height: "0"
                    }
                },
                rainbow: {
                    "0%": {
                        "background-position": "0%"
                    },
                    "100%": {
                        "background-position": "200%"
                    }
                },
                shimmer: {
                    "0%": {
                        left: "-100%",
                        top: "-100%",
                    },
                    "30%": {
                        left: "100%",
                        top: "100%",
                    },
                    "50%, 100%": {
                        left: "100%",
                        top: "100%",
                    },
                },
                sparkle: {
                    "0%, 100%": { opacity: 0, transform: "scale(0)" },
                    "50%": { opacity: 0.7, transform: "scale(0.8)" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                pulse: "pulse var(--duration) ease-out infinite",
                rainbow: "rainbow var(--speed, 2s) infinite linear",
                shimmer: "shimmer 6s infinite linear",
                sparkle: "sparkle 4s ease-in-out infinite",
            }
        }
    },
    plugins: [
        require("tailwindcss-animate"),
        require("@tailwindcss/typography"),
    ],
};
