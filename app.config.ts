import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import {defineConfig} from "@tanstack/react-start/config";


export default defineConfig({
    vite: {
        plugins: [
            tsConfigPaths({ projects: ["./tsconfig.json"] }),
            tailwindcss(),
        ],
    },
    react: {
        babel: {
            plugins: [["babel-plugin-react-compiler", { target: "19" }]],
        },
    },
    tsr: {
        appDirectory: "./src",
    },
    server: {
        preset: "node-server",
    },
});
