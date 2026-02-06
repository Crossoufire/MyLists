import {z} from "zod";
import {eq, isNull} from "drizzle-orm";
import {serverEnv} from "@/env/server";
import {ApiProviderType} from "@/lib/utils/enums";
import {defineTask} from "@/lib/server/tasks/define-task";
import {apiTokens, games} from "@/lib/server/database/schema";
import {getDbClient} from "@/lib/server/database/async-storage";


export const backfillGamesSteamApiIdTask = defineTask({
    name: "backfill-games-steam-api-id" as const,
    visibility: "admin",
    description: "Backfill Steam app ids for games missing them",
    inputSchema: z.object({}),
    handler: async (ctx) => {
        const gamesMissingSteam = await getDbClient()
            .select({ apiId: games.apiId })
            .from(games)
            .where(isNull(games.steamApiId));

        const igdbToken = getDbClient()
            .select()
            .from(apiTokens)
            .where(eq(apiTokens.provider, ApiProviderType.IGDB))
            .get();

        const total = gamesMissingSteam.length;
        if (total === 0) {
            ctx.info("No games missing Steam app ids.");
            return;
        }

        const batchSize = 500;
        const allIds = gamesMissingSteam.map((r) => r.apiId);

        ctx.info(`Found ${total} games to process.`);

        for (let i = 0; i < allIds.length; i += batchSize) {
            const batch = allIds.slice(i, i + batchSize);
            ctx.info(`Processing batch starting at index ${i}...`);

            try {
                const response = await fetch("https://api.igdb.com/v4/external_games", {
                    method: "POST",
                    headers: {
                        "Content-Type": "text/plain",
                        "Accept": "application/json",
                        "Client-ID": serverEnv.IGDB_CLIENT_ID,
                        Authorization: `Bearer ${igdbToken?.accessToken}`,
                    },
                    body: `fields game, uid; where game = (${batch.join(",")}) & external_game_source = 1; limit 500;`,
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`IGDB API Error: ${response.status} - ${errorText}`);
                }

                const externalGames = (await response.json()) as { game: number; uid: string }[];
                if (externalGames.length > 0) {
                    await Promise.all(externalGames.map((extGame) => getDbClient()
                        .update(games)
                        .set({ steamApiId: extGame.uid })
                        .where(eq(games.apiId, extGame.game))
                    ));
                    ctx.info(`Updated ${externalGames.length} games in this batch.`);
                }
            }
            catch (err) {
                ctx.error(`Batch at index ${i} failed: ${err}`);
            }
        }

        ctx.info("Task finished.");
    },
});
