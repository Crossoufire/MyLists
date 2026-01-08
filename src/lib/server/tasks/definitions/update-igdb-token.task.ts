import {z} from "zod";
import path from "path";
import * as fs from "fs";
import {MediaType} from "@/lib/utils/enums";
import {getContainer} from "@/lib/server/core/container";
import {defineTask} from "@/lib/server/tasks/define-task";


export const updateIgdbTokenTask = defineTask({
    name: "update-igdb-token" as const,
    visibility: "admin",
    description: "Fetch and update IGDB API token in .env file",
    inputSchema: z.object({}),
    handler: async (ctx) => {
        const container = await getContainer();
        const gamesProvider = container.registries.mediaProviderService.getService(MediaType.GAMES);

        const accessToken = await ctx.step("fetch-token", async () => {
            const token = await gamesProvider.fetchNewIgdbToken();

            if (!token) {
                throw new Error("IGDB API returned an empty access token");
            }

            ctx.info("Successfully retrieved new token from IGDB");
            return token;
        });

        if (!accessToken) return;

        await ctx.step("write-to-env", async () => {
            await updateEnvFile("IGDB_API_KEY", accessToken);

            ctx.metric("token_updated", 1);
            ctx.info("IGDB_API_KEY has been updated in the .env file");
        });
    },
});


async function updateEnvFile(key: string, value: string) {
    const envPath = path.resolve(process.cwd(), ".env");

    let envContent = "";
    if (fs.existsSync(envPath)) {
        envContent = await fs.promises.readFile(envPath, "utf8");
    }

    const lines = envContent.split("\n");
    let keyFound = false;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith(`${key}=`)) {
            lines[i] = `${key}=${value}`;
            keyFound = true;
            break;
        }
    }

    if (!keyFound) {
        throw new Error(`Key ${key} not found in '.env' file`);
    }

    await fs.promises.writeFile(envPath, lines.join("\n"));
}
