import {defineConfig} from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import {tanstackStart} from "@tanstack/react-start/plugin/vite";


export default defineConfig({
    plugins: [
        tsConfigPaths({ projects: ["./tsconfig.json"] }),
        tailwindcss(),
        tanstackStart({
            spa: {
                enabled: true,
            },
            react: {
                babel: {
                    plugins: [["babel-plugin-react-compiler", { target: "19" }]],
                },
            }
        }),
    ]
})
