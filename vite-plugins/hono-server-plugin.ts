import {ResolvedConfig} from "vite";
import {join, resolve} from "node:path";
import {existsSync, writeFileSync} from "node:fs";


interface HonoServerPluginOptions {
    /**
     * The port to use for the production server (default: 3000).
     * Can be overridden by process.env.PORT at runtime.
     */
    port?: number;
    /**
     * The output filename for the generated server script (default: "index.js").
     */
    filename?: string;
}


const generateHonoScript = (options: HonoServerPluginOptions) => `import {Hono} from "hono";
import {fileURLToPath} from "node:url";
import {dirname, join} from "node:path";
import {serve} from "@hono/node-server";
import {serveStatic} from "@hono/node-server/serve-static";


const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : ${options.port};


async function startProdServer() {
    const app = new Hono();
    
    app.use(serveStatic({ root: join(__dirname, "../client") }));
    
    const { default: tssHandler } = await import("./server.js");
    
    app.all("*", async (c) => {
        try {
            return tssHandler.fetch(c.req.raw);
        } 
        catch (err) {
            console.error("Prod Server Error:");
            console.error(err);
            return c.text("Internal Server Error", 500);
        }
    });
    
    serve({
        port: PORT,
        fetch: app.fetch,
    });
    
    console.log(\`Production server is running on http://localhost:\${PORT}\`);
}


async function main() {
    try {
        await startProdServer();
    } 
    catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
}


main();
`;


export default function honoServerPlugin(userOptions: Partial<HonoServerPluginOptions> = {}) {
    let config: ResolvedConfig;

    const options: Required<HonoServerPluginOptions> = {
        port: 3000,
        filename: "index.js",
        ...userOptions,
    };

    return {
        name: "vite-plugin-hono-server",
        configResolved(resolvedConfig: ResolvedConfig) {
            config = resolvedConfig;
        },
        closeBundle() {
            if (!config) {
                console.warn("[vite-plugin-hono-server] Config not resolved, skipping gen.");
                return
            }

            const outputPath = resolve(config.root, config.build.outDir);
            const outputFile = join(outputPath, options.filename);
            const serverEntry = join(outputPath, "server.js");

            if (!existsSync(serverEntry)) {
                console.warn(`[vite-plugin-hono-server] Server entry not found at ${serverEntry}. Skipping gen.`);
                return;
            }

            try {
                const scriptCode = generateHonoScript(options);

                writeFileSync(outputFile, scriptCode, "utf-8");
                console.log(`[vite-plugin-hono-server] Generated hono server script at ${outputFile}`);
            }
            catch (err) {
                console.error("[vite-plugin-hono-server] Failed to generate server script:", err);
            }
        },
    };
}
