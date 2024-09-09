import {resolve} from "path";
import {defineConfig} from "vite";
import {dirname} from "node:path";
import {fileURLToPath} from "node:url";
import viteReact from "@vitejs/plugin-react";
import {TanStackRouterVite} from "@tanstack/router-plugin/vite";


const __dirname = dirname(fileURLToPath(import.meta.url));


/** @type {import("vite").UserConfig} */
export default defineConfig({
    plugins: [
        TanStackRouterVite(),
        viteReact(),
    ],
    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
        },
    },
    server: {
        watch: {
            usePolling: true,
            interval: 800,
            binaryInterval: 800,
        },
        open: true,
        port: 3000,
        proxy: {
            "/api": {
                target: "http://localhost:5000",
                changeOrigin: true,
            }
        }
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    react: ["react", "react-dom"],
                    nivoCore: ["@nivo/core"],
                    nivoBar: ["@nivo/bar"],
                    nivoPie: ["@nivo/pie"],
                },
            },
        },
    },
});
