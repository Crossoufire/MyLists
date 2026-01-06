import {z} from "zod";
import path from "path";
import * as fs from "fs";
import {MediaType} from "@/lib/utils/enums";
import {getContainer} from "@/lib/server/core/container";
import {defineTask} from "@/lib/server/tasks/define-task";


export const updateIgdbTokenTask = defineTask({
    meta: {
        visibility: "admin",
        description: "Fetch and update IGDB API token in .env file",
    },
    inputSchema: z.object({}),
    handler: async (ctx) => {
        ctx.logger.info("Starting: UpdateIgdbToken execution.");

        const container = await getContainer();
        const gamesProvider = container.registries.mediaProviderService.getService(MediaType.GAMES);

        const accessToken = await gamesProvider.fetchNewIgdbToken();
        if (!accessToken) {
            throw new Error("Failed to fetch new IGDB token");
        }

        await updateEnvFile("IGDB_API_KEY", accessToken);

        ctx.logger.info("IGDB token updated successfully.");
        ctx.logger.info("Completed: UpdateIgdbToken execution.");
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
