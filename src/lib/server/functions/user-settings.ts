import {z} from "zod";
import {capitalize} from "@/lib/utils/functions";
import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {saveUploadedImage} from "@/lib/server/utils/save-image";
import {MediaType, PrivacyType} from "@/lib/server/utils/enums";
import {authMiddleware} from "@/lib/server/middlewares/authentication";


const generalSettingsSchema = z.object({
    profileImage: z.instanceof(File).optional(),
    backgroundImage: z.instanceof(File).optional(),
    privacy: z.enum(Object.values(PrivacyType) as [PrivacyType, ...PrivacyType[]]),
    username: z.string().trim()
        .min(3, "Username too short (3 min)")
        .max(15, "Username too long (15 max)"),
});


export const postGeneralSettings = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
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


export const postMediaListSettings = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator((data: any) => data)
    .handler(async ({ data, context: { currentUser } }) => {
        const userService = getContainer().services.user;

        const mediaTypes = [MediaType.ANIME, MediaType.GAMES, MediaType.BOOKS, MediaType.MANGA];
        for (const mediaType of mediaTypes) {
            const settingKey = `add${capitalize(mediaType)}`;
            if (data[settingKey]) {

            }
        }

        //@ts-expect-error
        await userService.updateUserSettings(currentUser.id, data);
    });


export const postDownloadListAsCSV = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator((data: any) => data)
    .handler(async ({ data, context: { currentUser } }) => {

    });
