import {defineConfig} from "vite";
import tsConfigPaths from "vite-tsconfig-paths";


export default defineConfig({
    plugins: [
        tsConfigPaths({ projects: ["./tsconfig.json"] }),
    ],
    build: {
        minify: false,
        target: "esnext",
        emptyOutDir: true,
        copyPublicDir: false,
        outDir: "dist/cli",
        ssr: "src/cli/index.ts",
    },
})
