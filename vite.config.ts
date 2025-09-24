import {config} from "dotenv";
import {defineConfig} from "vite";
import tailwindcss from "@tailwindcss/vite";
import reactVite from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import {devtools} from "@tanstack/devtools-vite";
import {tanstackStart} from "@tanstack/react-start/plugin/vite";

// TODO: To be removed, bug since RC, .env should be automatically loaded
config();

export default defineConfig({
    plugins: [
        devtools(),
        tsConfigPaths({ projects: ["./tsconfig.json"] }),
        tanstackStart({
            router: {
                semicolons: true,
                quoteStyle: "double",
            },
            spa: {
                enabled: true,
            },
        }),
        reactVite({
            babel: {
                plugins: [["babel-plugin-react-compiler", { target: "19" }]],
            },
        }),
        tailwindcss(),
    ]
})
