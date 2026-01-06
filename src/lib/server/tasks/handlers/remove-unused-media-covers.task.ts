import {z} from "zod";
import path from "path";
import * as fs from "fs";
import {serverEnv} from "@/env/server";
import {MediaType} from "@/lib/utils/enums";
import {getContainer} from "@/lib/server/core/container";
import {defineTask} from "@/lib/server/tasks/define-task";


export const removeUnusedMediaCoversTask = defineTask({
    meta: {
        visibility: "admin",
        description: "Delete cover image files not referenced in the database",
    },
    inputSchema: z.object({
        dryRun: z.boolean().optional().describe("Log files to delete without actually deleting"),
        mediaTypes: z.array(z.enum(MediaType)).optional().describe("Media types to clean (all if omitted)"),
    }),
    handler: async (ctx) => {
        ctx.logger.info("Starting: RemoveUnusedMediaCovers execution.");

        const container = await getContainer();
        const mediaRegistry = container.registries.mediaService;
        const baseUploadsLocation = serverEnv.BASE_UPLOADS_LOCATION;
        const typesToProcess = ctx.input.mediaTypes ?? Object.values(MediaType);

        console.log({ typesToProcess })

        for (const mediaType of typesToProcess) {
            ctx.logger.info({ mediaType }, "Starting cover cleanup...");

            const coversDirectoryPath = path.isAbsolute(baseUploadsLocation)
                ? path.join(baseUploadsLocation, `${mediaType}-covers`)
                : path.join(process.cwd(), baseUploadsLocation, `${mediaType}-covers`);

            const mediaService = mediaRegistry.getService(mediaType);
            const dbCoverFilenames = await mediaService.getCoverFilenames();
            const dbCoverSet = new Set(dbCoverFilenames);

            const filesOnDisk = await fs.promises.readdir(coversDirectoryPath);
            ctx.logger.info({ count: filesOnDisk.length }, "Files found in directory");

            const coversToDelete = filesOnDisk.filter((filename) => !dbCoverSet.has(filename) && filename !== "default.jpg");
            if (coversToDelete.length === 0) {
                ctx.logger.info({ mediaType }, "No old covers to remove");
                continue;
            }

            ctx.logger.info({ mediaType, count: coversToDelete.length }, "Covers to remove");

            if (ctx.input.dryRun) {
                ctx.logger.info({ covers: coversToDelete }, "Dry run - would delete these files");
                continue;
            }

            let failedCount = 0;
            let deletionCount = 0;

            for (const cover of coversToDelete) {
                const filePath = path.join(coversDirectoryPath, cover);
                try {
                    await fs.promises.unlink(filePath);
                    deletionCount += 1;
                }
                catch (err) {
                    failedCount += 1;
                    ctx.logger.warn({ err, cover }, "Failed to delete cover");
                }
            }

            ctx.logger.info({ mediaType, deletionCount, failedCount }, "Cleanup finished");
        }

        ctx.logger.info("Completed: RemoveUnusedMediaCovers execution.");
    },
});
