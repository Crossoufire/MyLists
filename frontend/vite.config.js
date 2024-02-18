import path from "path";
import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import {visualizer} from "rollup-plugin-visualizer";


/** @type {import('vite').UserConfig} */
export default defineConfig({
    plugins: [react(), visualizer()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        watch: {
            usePolling: true,
            interval: 500,
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
