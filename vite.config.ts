import {defineConfig} from "vite";
import tailwindcss from "@tailwindcss/vite";
import reactVite from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import {tanstackStart} from "@tanstack/react-start/plugin/vite";


export default defineConfig({
    plugins: [
        tsConfigPaths({ projects: ["./tsconfig.json"] }),
        tailwindcss(),
        tanstackStart({
            customViteReactPlugin: true,
            spa: {
                enabled: true,
            },
        }),
        reactVite({
            babel: {
                plugins: [["babel-plugin-react-compiler", { target: "19" }]],
            },
        }),
    ]
})
