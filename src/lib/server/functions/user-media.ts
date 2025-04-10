import {notFound} from "@tanstack/react-router";
import {container} from "@/lib/server/container";
import {UpdateType} from "@/lib/server/utils/enums";
import {createServerFn} from "@tanstack/react-start";
import {authMiddleware} from "@/lib/server/middlewares/authentication";


export const postUpdateUserMedia = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator((data: any) => data)
    .handler(async ({ data, context: { currentUser } }) => {
        const { mediaType, mediaId, payload, updateType } = data;

        const userStatsService = container.services.userStats;
        const userUpdatesService = container.services.userUpdates;
        const mediaService = container.registries.mediaService.getService(mediaType);

        const mediaDetails = await mediaService.getMinimalMediaDetails(mediaId);
        if (!mediaDetails) throw notFound();

        const oldState = await mediaService.getUserMediaDetails(currentUser.id, mediaId);
        const newState = await mediaService.updateUserMediaDetails(currentUser.id, mediaId, payload);
        const delta = await mediaService.calculateDeltaStats(oldState, newState, mediaDetails);

        //@ts-expect-error
        await userStatsService.updateUserStats({ mediaType, userId: currentUser.id, delta });

        const { oldValue, newValue } = logValueExtractors[updateType as UpdateType](oldState, newState);

        await userUpdatesService.logUpdate({
            //@ts-expect-error
            userId: currentUser.id,
            mediaType,
            media: mediaDetails,
            updateType,
            oldValue,
            newValue,
        });
    });


type LogValueExtractor = (oldState: any | null, newState: any) => { oldValue: any; newValue: any };

const logValueExtractors: Record<UpdateType, LogValueExtractor> = {
    redo: (os, ns) => ({ oldValue: os?.redo ?? 0, newValue: ns.redo }),
    status: (os, ns) => ({ oldValue: os?.status ?? null, newValue: ns.status }),
    page: (os, ns) => ({ oldValue: os?.actualPage ?? null, newValue: ns.actualPage }),
    chapter: (os, ns) => ({ oldValue: os?.currentChapter ?? 0, newValue: ns.currentChapter }),
    playtime: (os, ns) => ({ oldValue: os?.playtime ?? 0, newValue: ns.playtime }),
    tv: (os, ns) => ({
        oldValue: { season: os?.season ?? null, episode: os?.episode ?? null },
        newValue: { season: ns.season, episode: ns.episode },
    }),
}