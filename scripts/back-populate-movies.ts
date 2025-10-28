import {db} from "@/lib/server/database/db";
import {MediaType} from "@/lib/utils/enums";
import {and, isNull, or} from "drizzle-orm";
import {movies} from "@/lib/server/database/schema";
import {getContainer} from "@/lib/server/core/container";


export const backPopulateCollectionIdsAndCompositorsForMovies = async () => {
    console.log(`Retroactively add collection_id and compositor to movies...`);

    const results = await db
        .select({ apiId: movies.apiId })
        .from(movies)
        .where(and(
            // gte(movies.voteCount, 5000),
            or(isNull(movies.compositorName), isNull(movies.collectionId)),
        ));

    const moviesApiIds = results.map((r) => r.apiId);
    console.log(`Number of movies to update: ${moviesApiIds.length}`);

    const moviesProvider = await getContainer().then((c) => c.registries.mediaProviderService.getService(MediaType.MOVIES));

    let processed = 0;
    const windowSize = 20;
    const startTime = Date.now();
    const processingTimes: number[] = [];

    for (const apiId of moviesApiIds) {
        try {
            const itemStart = Date.now();
            await moviesProvider.fetchAndRefreshMediaDetails(apiId, true);
            const itemTime = Date.now() - itemStart;

            processingTimes.push(itemTime);
            if (processingTimes.length > windowSize) {
                processingTimes.shift();
            }
            processed += 1;

            if (processed % 10 === 0) {
                const avgTimePerItem = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
                const remaining = moviesApiIds.length - processed;
                const etaSeconds = (remaining * avgTimePerItem) / 1000;
                const minutes = Math.floor(etaSeconds / 60);
                const seconds = Math.round(etaSeconds % 60);

                console.log(
                    `${processed}/${moviesApiIds.length} | ` +
                    `${(1000 / avgTimePerItem).toFixed(2)}/s | ` +
                    `ETA: ${minutes}m ${seconds}s`
                );
            }
        }
        catch (err) {
            console.log("An error occured", { err });
        }
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n✓ Done! - Total time: ${totalTime}s`);
};


if (import.meta.main) {
    backPopulateCollectionIdsAndCompositorsForMovies()
        .then(() => console.log("All done!"))
        .catch((err) => {
            console.error("Process failed:", err);
            process.exit(1);
        });
}
