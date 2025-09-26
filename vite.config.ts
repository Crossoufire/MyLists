import {config} from "dotenv";
import {defineConfig} from "vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import {devtools} from "@tanstack/devtools-vite";
import {tanstackStart} from "@tanstack/react-start/plugin/vite";
import honoServerPlugin from "./vite-plugins/hono-server-plugin";


// TODO: To be removed, bug since RC, .env should be automatically loaded in dev
config();


export default defineConfig({
    plugins: [
        devtools(),
        tsConfigPaths({ projects: ["./tsconfig.json"] }),
        tanstackStart({
            spa: {
                enabled: true,
            },
            router: {
                semicolons: true,
                quoteStyle: "double",
            },
        }),
        viteReact({
            babel: {
                plugins: [["babel-plugin-react-compiler", { target: "19" }]],
            },
        }),
        tailwindcss(),
        honoServerPlugin({
            port: 3000,
            filename: "hono.js",
        }),
    ],
})
