import {resolve} from "path";
import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import {TanStackRouterVite} from "@tanstack/router-plugin/vite";


/** @type {import("vite").UserConfig} */
export default defineConfig({
    plugins: [
        TanStackRouterVite(),
        react({ babel: { plugins: [["babel-plugin-react-compiler"]] } }),
    ],
    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
        },
    },
    server: {
        port: 3000,
        proxy: {
            "/api": {
                target: "http://127.0.0.1:5000",
                changeOrigin: true,
            }
        }
    },
    build: {
        chunkSizeWarningLimit: 700,
        rollupOptions: {
            output: {
                manualChunks: {
                    react: ["react", "react-dom"],
                    recharts: ["recharts"],
                },
            },
        },
    },
});
