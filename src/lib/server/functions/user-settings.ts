import {auth} from "@/lib/server/core/auth";
import {MediaType} from "@/lib/utils/enums";
import {createServerFn} from "@tanstack/react-start";
import {user} from "@/lib/server/database/schema/index";
import {getContainer} from "@/lib/server/core/container";
import {FormattedError} from "@/lib/utils/error-classes";
import {tryFormZodError} from "@/lib/utils/try-not-found";
import {saveUploadedImage} from "@/lib/utils/image-saver";
import {requiredAuthMiddleware} from "@/lib/server/middlewares/authentication";
import {transactionMiddleware} from "@/lib/server/middlewares/transaction";
import {downloadListAsCsvSchema, generalSettingsSchema, mediaListSettingsSchema, passwordSettingsSchema} from "@/lib/types/zod.schema.types";


export const postGeneralSettings = createServerFn({ method: "POST" })
    .middleware([requiredAuthMiddleware, transactionMiddleware])
    .inputValidator(tryFormZodError(generalSettingsSchema))
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
                resize: { height: 256 },
            });
            updatesToApply.backgroundImage = backgroundImageName;
        }

        await userService.updateUserSettings(currentUser.id, updatesToApply);
    });


export const postMediaListSettings = createServerFn({ method: "POST" })
    .middleware([requiredAuthMiddleware, transactionMiddleware])
    .inputValidator(tryFormZodError(mediaListSettingsSchema))
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
    .middleware([requiredAuthMiddleware])
    .inputValidator(tryFormZodError(downloadListAsCsvSchema))
    .handler(async ({ data: { selectedList }, context: { currentUser } }) => {
        const container = await getContainer();
        const mediaService = container.registries.mediaService.getService(selectedList);
        return mediaService.downloadMediaListAsCSV(currentUser.id);
    });


export const postPasswordSettings = createServerFn({ method: "POST" })
    .middleware([requiredAuthMiddleware])
    .inputValidator(tryFormZodError(passwordSettingsSchema))
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
    .middleware([requiredAuthMiddleware])
    .handler(async ({ context: { currentUser } }) => {
        const userService = await getContainer().then((c) => c.services.user);
        return userService.deleteUserAccount(currentUser.id);
    });


export const postUpdateFeatureFlag = createServerFn({ method: "POST" })
    .middleware([requiredAuthMiddleware])
    .handler(async ({ context: { currentUser } }) => {
        const userService = await getContainer().then((c) => c.services.user);
        return userService.updateFeatureFlag(currentUser.id);
    });


// const csvFileZodSchema = z.object({
//     file: z
//         .instanceof(File)
//         .refine((file) => file.size <= 1 * 1024 * 1024, `File size must be less than 1MB.`)
//         .refine((file) => ["text/csv"].includes(file.type), "File must be a .csv file."),
// });
//
//
// export const postUploadsCsvFile = createServerFn({ method: "POST" })
//     .middleware([authMiddleware])
//     .inputValidator((data) => {
//         if (!(data instanceof FormData)) throw new Error();
//         return tryFormZodError(csvFileZodSchema, Object.fromEntries(data.entries()));
//     })
//     .handler(async ({ data, context: { currentUser } }) => {
//         try {
//             // Save file to tmp location
//             const buffer = Buffer.from(await data.file.arrayBuffer());
//             const tempDir = path.join(process.cwd(), "tmp", "csv-uploads");
//             await mkdir(tempDir, { recursive: true });
//             const filePath = path.join(tempDir, `${currentUser.id}-${Date.now()}.csv`);
//             await writeFile(filePath, buffer);
//
//             const taskId = randomUUID();
//
//             await executeTask({
//                 taskId,
//                 filePath,
//                 triggeredBy: "user",
//                 userId: currentUser.id,
//                 taskName: "processCsv",
//             });
//
//             return { taskId: taskId };
//         }
//         catch (err) {
//             if (err instanceof FormattedError) {
//                 throw err;
//             }
//             throw new FormattedError("Sorry, failed to process your CSV.");
//         }
//     });
//
//
// export const getUserUploads = createServerFn({ method: "GET" })
//     .middleware([authMiddleware])
//     .inputValidator((data) => data as { taskId: string })
//     .handler(async ({ data: { taskId }, context: { currentUser } }) => {
//         try {
//             const dbRow = await getDbClient()
//                 .select()
//                 .from(taskHistory)
//                 .where(and(eq(taskHistory.userId, currentUser.id), eq(taskHistory.taskId, taskId)))
//                 .get();
//
//             const resultLog = dbRow?.logs.find((log) => "result" in log);
//             return resultLog?.result;
//         }
//         catch (err) {
//             if (err instanceof FormattedError) {
//                 throw err;
//             }
//
//             throw new FormattedError("Failed to fetch your CSV uploads results.");
//         }
//     });
