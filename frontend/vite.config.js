import path from "path";
import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import {TanStackRouterVite} from "@tanstack/router-vite-plugin";


/** @type {import('vite').UserConfig} */
export default defineConfig({
    plugins: [react(), TanStackRouterVite()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        watch: {
            usePolling: true,
            interval: 300,
            binaryInterval: 300,
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
                    recharts: ["recharts"]
                },
            },
        },
    },
});
