import z from "zod";
import {auth} from "@/lib/server/core/auth";
import {MediaType} from "@/lib/utils/enums";
import {getQueue} from "@/lib/utils/get-queue";
import {createServerFn} from "@tanstack/react-start";
import {user} from "@/lib/server/database/schema/index";
import {getContainer} from "@/lib/server/core/container";
import {saveUploadedImage} from "@/lib/utils/save-image";
import {FormattedError} from "@/lib/utils/error-classes";
import {tryFormZodError} from "@/lib/utils/try-not-found";
import {authMiddleware} from "@/lib/server/middlewares/authentication";
import {transactionMiddleware} from "@/lib/server/middlewares/transaction";
import {downloadListAsCsvSchema, generalSettingsSchema, mediaListSettingsSchema, passwordSettingsSchema} from "@/lib/types/zod.schema.types";
import path from "path";
import {mkdir, writeFile} from "fs/promises";


export const postGeneralSettings = createServerFn({ method: "POST" })
    .middleware([authMiddleware, transactionMiddleware])
    .inputValidator((data) => {
        if (!(data instanceof FormData)) throw new Error();
        return tryFormZodError(generalSettingsSchema, Object.fromEntries(data.entries()));
    })
    .handler(async ({ data, context: { currentUser } }) => {
        const userService = await getContainer().then((c) => c.services.user);
        const updatesToApply: Partial<typeof user.$inferInsert> = { privacy: data.privacy };

        if (data.username !== currentUser.name.trim()) {
            await userService.findUserByName(data.username);
            updatesToApply.name = data.username;
        }

        if (data.profileImage) {
            const profileImageName = await saveUploadedImage({
                file: data.profileImage,
                dirSaveName: "profile-covers",
                resize: { width: 300, height: 300 },
            });
            updatesToApply.image = profileImageName;
        }

        if (data.backgroundImage) {
            const backgroundImageName = await saveUploadedImage({
                file: data.backgroundImage,
                dirSaveName: "profile-back-covers",
                resize: { width: 1304, height: 288 },
            });
            updatesToApply.backgroundImage = backgroundImageName;
        }

        await userService.updateUserSettings(currentUser.id, updatesToApply);
    });


export const postMediaListSettings = createServerFn({ method: "POST" })
    .middleware([authMiddleware, transactionMiddleware])
    .inputValidator((data) => tryFormZodError(mediaListSettingsSchema, data))
    .handler(async ({ data, context: { currentUser } }) => {
        const userService = await getContainer().then(c => c.services.user);
        const userStatsService = await getContainer().then(c => c.services.userStats);

        const toUpdateInUserStats: Partial<Record<MediaType, boolean>> = {
            anime: data.anime,
            games: data.games,
            books: data.books,
            manga: data.manga,
        }

        const toUpdateInUser = {
            ratingSystem: data.ratingSystem,
            gridListView: data.gridListView,
            searchSelector: data.searchSelector,
        }

        await userService.updateUserSettings(currentUser.id, toUpdateInUser);
        await userStatsService.updateUserMediaListSettings(currentUser.id, toUpdateInUserStats);
    });


export const getDownloadListAsCSV = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .inputValidator((data) => tryFormZodError(downloadListAsCsvSchema, data))
    .handler(async ({ data: { selectedList }, context: { currentUser } }) => {
        const container = await getContainer();
        const mediaService = container.registries.mediaService.getService(selectedList);
        return mediaService.downloadMediaListAsCSV(currentUser.id);
    });


export const postPasswordSettings = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .inputValidator((data) => tryFormZodError(passwordSettingsSchema, data))
    .handler(async ({ data: { newPassword, currentPassword }, context: { currentUser } }) => {
        const ctx = await auth.$context;
        const userAccount = await ctx.internalAdapter.findAccount(currentUser.id.toString());

        const isValid = await ctx.password.verify({ hash: userAccount?.password ?? "", password: currentPassword });
        if (!isValid) {
            throw new FormattedError("Current password incorrect");
        }

        const hash = await ctx.password.hash(newPassword);
        await ctx.internalAdapter.updatePassword(currentUser.id.toString(), hash)
    });


export const postDeleteUserAccount = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .handler(async ({ context: { currentUser } }) => {
        const userService = await getContainer().then((c) => c.services.user);
        return userService.deleteUserAccount(currentUser.id);
    });


export const postUpdateFeatureFlag = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .handler(async ({ context: { currentUser } }) => {
        const userService = await getContainer().then((c) => c.services.user);
        return userService.updateFeatureFlag(currentUser.id);
    });


export const csvFileZodSchema = z.object({
    taskName: z.literal("processCsv"),
    file: z
        .instanceof(File)
        .refine((file) => file.size <= 5 * 1024 * 1024, `File size must be less than 5MB.`)
        .refine((file) => ["text/csv"].includes(file.type), "File must be a .csv file."),
});


export const postProcessCsvFile = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .inputValidator(csvFileZodSchema)
    .handler(async ({ data, context: { currentUser } }) => {
        const mylistsTaskQueue = await getQueue();

        if (!mylistsTaskQueue) {
            return {
                success: true,
                jobId: "dev-mode-job",
                message: "processCsv is disabled in dev mode.",
            };
        }

        try {
            const existingJobs = await mylistsTaskQueue.getJobs(["waiting", "active", "delayed"]);
            const hasActiveCsvJob = existingJobs.some((job) => {
                if ("userId" in job.data) {
                    return job.data?.userId === currentUser.id;
                }
                return false;
            });

            if (hasActiveCsvJob) {
                throw new FormattedError(
                    "You already have a CSV processing job running. " +
                    "Please wait for it to complete before starting a new one."
                );
            }

            // Save file to tmp location
            const buffer = Buffer.from(await data.file.arrayBuffer());
            const tempDir = path.join(process.cwd(), "tmp", "csv-uploads");
            await mkdir(tempDir, { recursive: true });
            const filePath = path.join(tempDir, `${currentUser.id}-${Date.now()}.csv`);
            await writeFile(filePath, buffer);

            const job = await mylistsTaskQueue.add(data.taskName, {
                filePath: filePath,
                triggeredBy: "user",
                userId: currentUser.id,
            });

            return {
                jobId: job.id,
                success: true,
                message: "Processing your CSV file...",
            };
        }
        catch (error) {
            if (error instanceof FormattedError) {
                throw error;
            }
            throw new FormattedError("Sorry, failed to process the CSV.");
        }
    });