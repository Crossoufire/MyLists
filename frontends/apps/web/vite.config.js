import {resolve} from "path";
import {defineConfig} from "vite";
import viteReact from "@vitejs/plugin-react";
import {TanStackRouterVite} from "@tanstack/router-plugin/vite";


/** @type {import("vite").UserConfig} */
export default defineConfig({
    plugins: [
        TanStackRouterVite(),
        viteReact(),
    ],
    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
            "@mylists/api": resolve(__dirname, "../../libs/api"),
        },
    },
    server: {
        open: true,
        port: 3000,
        proxy: {
            "/api": {
                target: "http://127.0.0.1:5000",
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
                    apiLib: ["@mylists/api"],
                },
            },
        },
    },
});
