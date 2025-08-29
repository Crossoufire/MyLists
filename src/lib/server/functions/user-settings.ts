import {auth} from "@/lib/server/core/auth";
import {MediaType} from "@/lib/server/utils/enums";
import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {saveUploadedImage} from "@/lib/server/utils/save-image";
import {FormattedError} from "@/lib/server/utils/error-classes";
import {tryFormZodError} from "@/lib/server/utils/try-not-found";
import {authMiddleware} from "@/lib/server/middlewares/authentication";
import {transactionMiddleware} from "@/lib/server/middlewares/transaction";

import {downloadListAsCsvSchema, generalSettingsSchema, mediaListSettingsSchema, passwordSettingsSchema} from "@/lib/types/zod.schema.types";


export const postGeneralSettings = createServerFn({ method: "POST" })
    .middleware([authMiddleware, transactionMiddleware])
    .validator(data => {
        if (!(data instanceof FormData)) throw new Error("Expected FormData");
        return tryFormZodError(() => generalSettingsSchema.parse(Object.fromEntries(data.entries())));
    })
    .handler(async ({ data, context: { currentUser } }) => {
        const userService = await getContainer().then(c => c.services.user);
        const updatesToApply: Record<string, string> = { privacy: data.privacy };

        if (data.username !== currentUser.name.trim()) {
            const isUsernameTaken = await userService.findUserByName(data.username);
            if (isUsernameTaken) throw new FormattedError("Username invalid. Please select another one.");
            updatesToApply.name = data.username;
        }

        if (data.profileImage) {
            const profileImageName = await saveUploadedImage({
                file: data.profileImage,
                saveLocation: "./public/static/profile-covers",
                resize: { width: 300, height: 300 },
            });
            updatesToApply.image = profileImageName;
        }

        if (data.backgroundImage) {
            const backgroundImageName = await saveUploadedImage({
                file: data.backgroundImage,
                saveLocation: "./public/static/back-covers",
                resize: { width: 1304, height: 288 },
            });
            updatesToApply.backgroundImage = backgroundImageName;
        }

        await userService.updateUserSettings(currentUser.id, updatesToApply);
    });


export const postMediaListSettings = createServerFn({ method: "POST" })
    .middleware([authMiddleware, transactionMiddleware])
    .validator(data => tryFormZodError(() => mediaListSettingsSchema.parse(data)))
    .handler(async ({ data, context: { currentUser } }) => {
        const userService = await getContainer().then(c => c.services.user);
        const userStatsService = await getContainer().then(c => c.services.userStats);

        const toUpdateInUserStats: Partial<Record<MediaType, boolean>> = {
            anime: data.anime,
            manga: data.manga,
            games: data.games,
            books: data.books,
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
    .validator(data => tryFormZodError(() => downloadListAsCsvSchema.parse(data)))
    .handler(async ({ data: { selectedList }, context: { currentUser } }) => {
        const container = await getContainer();
        const mediaService = container.registries.mediaService.getService(selectedList);
        return mediaService.downloadMediaListAsCSV(currentUser.id);
    });


export const postPasswordSettings = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(data => tryFormZodError(() => passwordSettingsSchema.parse(data)))
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
