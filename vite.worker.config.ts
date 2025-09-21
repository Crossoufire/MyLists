import {defineConfig} from "vite";
import tsConfigPaths from "vite-tsconfig-paths";


export default defineConfig({
    plugins: [
        tsConfigPaths({ projects: ["./tsconfig.json"] }),
    ],
    build: {
        target: "esnext",
        copyPublicDir: false,
        outDir: ".output/worker",
        ssr: "src/lib/server/core/bullmq/worker.ts",
    },
})
