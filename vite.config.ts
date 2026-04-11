import path from "path";
import {defineConfig} from "vite";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import {devtools} from "@tanstack/devtools-vite";
import {tanstackStart} from "@tanstack/react-start/plugin/vite";
import react, {reactCompilerPreset} from "@vitejs/plugin-react";


export default defineConfig({
    resolve: {
        tsconfigPaths: true,
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    plugins: [
        devtools(),
        tanstackStart({
            spa: {
                enabled: true,
            },
            router: {
                semicolons: true,
                quoteStyle: "double",
            },
        }),
        react(),
        babel({ presets: [reactCompilerPreset()] }),
        tailwindcss(),
    ],
})
