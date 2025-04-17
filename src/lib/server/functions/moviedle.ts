import {container} from "@/lib/server/container";
import {MediaType} from "@/lib/server/utils/enums";
import {createServerFn} from "@tanstack/react-start";
import {pixelateImage} from "@/lib/server/utils/image-pixelation";
import {authMiddleware} from "@/lib/server/middlewares/authentication";


export const getDailyMediadle = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .handler(async ({ context: { currentUser } }) => {
        const mediadleService = container.services.mediadle;
        const moviesService = container.registries.mediaService.getService(MediaType.MOVIES);

        let dailyMediadle = await mediadleService.getTodayMoviedle();
        if (!dailyMediadle) {
            dailyMediadle = await mediadleService.createDailyMoviedle();
        }

        // @ts-expect-error
        let userProgress = await mediadleService.getUserProgress(currentUser.id, dailyMediadle.id);
        if (!userProgress) {
            // @ts-expect-error
            userProgress = await mediadleService.createUserProgress(currentUser.id, dailyMediadle.id);
        }

        const selectedMovie = await moviesService.getById(dailyMediadle.mediaId);
        const pixelationLevel = Math.min(dailyMediadle.pixelationLevels!, userProgress.attempts! + 1);

        // @ts-expect-error
        const userMediadleStats = await mediadleService.getUserMediadleStats(currentUser.id);
        const pixelatedCover = await pixelateImage(selectedMovie?.imageCover, pixelationLevel);

        return {
            pixelatedCover,
            stats: userMediadleStats,
            mediadleId: dailyMediadle.id,
            mediaId: dailyMediadle.mediaId,
            attempts: userProgress.attempts!,
            completed: userProgress.completed!,
            succeeded: userProgress.succeeded!,
            maxAttempts: dailyMediadle.pixelationLevels!,
            nonPixelatedCover: userProgress.completed ? selectedMovie?.image : null,
        }
    });
