import {z} from "zod";
import {MediaType} from "@/lib/utils/enums";
import {getContainer} from "@/lib/server/core/container";
import {defineTask} from "@/lib/server/tasks/define-task";


export const lockOldMoviesTask = defineTask({
    meta: {
        visibility: "admin",
        description: "Lock movies older than 6 months to prevent edits",
    },
    inputSchema: z.object({}),
    handler: async (ctx) => {
        ctx.logger.info(`Starting locking movies older than 6 months...`);

        const container = await getContainer();
        const moviesService = container.registries.mediaService.getService(MediaType.MOVIES);
        const totalMoviesLocked = await moviesService.lockOldMovies();

        ctx.logger.info({ totalMoviesLocked }, `Locked ${totalMoviesLocked} movies older than 6 months.`);
        ctx.logger.info("Completed: LockOldMovies execution.");
    },
});
