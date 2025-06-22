import {z} from "zod";
import {auth} from "@/lib/server/core/auth";
import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {saveUploadedImage} from "@/lib/server/utils/save-image";
import {authMiddleware} from "@/lib/server/middlewares/authentication";
import {transactionMiddleware} from "@/lib/server/middlewares/transaction";
import {ApiProviderType, MediaType, PrivacyType, RatingSystemType} from "@/lib/server/utils/enums";


const generalSettingsSchema = z.object({
    profileImage: z.instanceof(File).optional(),
    backgroundImage: z.instanceof(File).optional(),
    privacy: z.enum(Object.values(PrivacyType) as [PrivacyType, ...PrivacyType[]]),
    username: z.string().trim()
        .min(3, "Username too short (3 min)")
        .max(15, "Username too long (15 max)"),
});


export const postGeneralSettings = createServerFn({ method: "POST" })
    .middleware([authMiddleware, transactionMiddleware])
    .validator((data: unknown) => {
        if (!(data instanceof FormData)) {
            throw new Error("Expected FormData");
        }

        const objectFromFormData: Record<string, unknown> = {};
        for (const [key, value] of data.entries()) {
            objectFromFormData[key] = value;
        }

        return generalSettingsSchema.parse(objectFromFormData);
    })
    .handler(async ({ data, context: { currentUser } }) => {
        const userService = getContainer().services.user;
        const updatesToApply = { privacy: data.privacy } as Record<string, any>;

        if (data.username !== currentUser.name.trim()) {
            const isUsernameTaken = await userService.getUserByName(data.username);
            if (isUsernameTaken) {
                throw new Error("Username invalid. Please choose another one.");
            }
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

        //@ts-expect-error
        await userService.updateUserSettings(currentUser.id, updatesToApply);
    });


const mediaListSettingsSchema = z.object({
    anime: z.boolean(),
    games: z.boolean(),
    manga: z.boolean(),
    books: z.boolean(),
    gridListView: z.boolean(),
    searchSelector: z.enum(Object.values(ApiProviderType) as [ApiProviderType, ...ApiProviderType[]]),
    ratingSystem: z.enum(Object.values(RatingSystemType) as [RatingSystemType, ...RatingSystemType[]]),
});


export const postMediaListSettings = createServerFn({ method: "POST" })
    .middleware([authMiddleware, transactionMiddleware])
    .validator((data: any) => mediaListSettingsSchema.parse(data))
    .handler(async ({ data, context: { currentUser } }) => {
        const userService = getContainer().services.user;
        const userStatsService = getContainer().services.userStats;

        const toUpdateinUserStats = {
            anime: data.anime,
            manga: data.manga,
            games: data.games,
            books: data.books,
        }
        const toUpdateInUser = {
            gridListView: data.gridListView,
            searchSelector: data.searchSelector,
            ratingSystem: data.ratingSystem,
        }

        //@ts-expect-error
        await userService.updateUserSettings(currentUser.id, toUpdateInUser);
        //@ts-expect-error
        await userStatsService.updateUserMediaListSettings(currentUser.id, toUpdateinUserStats);
    });


export const getDownloadListAsCSV = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator((data: any) => {
        if (!data.selectedList.includes(MediaType)) {
            throw new Error("Invalid media type");
        }
        return data as { selectedList: MediaType };
    })
    .handler(async ({ data: { selectedList }, context: { currentUser } }) => {
        const mediaService = getContainer().registries.mediaService.getService(selectedList);
        return mediaService.downloadMediaListAsCSV(parseInt(currentUser.id));
    });


const passwordSettingsSchema = z.object({
    newPassword: z.string().min(8).max(50),
    currentPassword: z.string().min(8).max(50),
});


export const postPasswordSettings = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator((data: any) => passwordSettingsSchema.parse(data))
    .handler(async ({ data: { newPassword, currentPassword }, context: { currentUser } }) => {
        const ctx = await auth.$context;
        const userAccount = await ctx.internalAdapter.findAccount(currentUser.id);

        const isValid = await ctx.password.verify({ hash: userAccount?.password ?? "", password: currentPassword });
        if (!isValid) {
            throw new Error("Current password is incorrect");
        }

        const hash = await ctx.password.hash(newPassword);
        await ctx.internalAdapter.updatePassword(currentUser.id, hash)
    });
