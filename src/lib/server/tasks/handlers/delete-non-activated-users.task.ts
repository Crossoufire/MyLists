import {z} from "zod";
import {getContainer} from "@/lib/server/core/container";
import {defineTask} from "@/lib/server/tasks/define-task";


export const deleteNonActivatedUsersTask = defineTask({
    meta: {
        visibility: "admin",
        description: "Delete user accounts that were never activated (older than 1 week)",
    },
    inputSchema: z.object({}),
    handler: async (ctx) => {
        ctx.logger.info("Starting: DeleteNonActivatedUsers execution.");

        const container = await getContainer();
        const userRepository = container.repositories.user;
        const deletedCount = await userRepository.deleteNonActivatedOldUsers();

        ctx.logger.info({ deletedCount }, `Deleted ${deletedCount} non-activated users older than a week.`);
        ctx.logger.info("Completed: DeleteNonActivatedUsers execution.");
    },
});
