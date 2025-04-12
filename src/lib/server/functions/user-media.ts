import {notFound} from "@tanstack/react-router";
import {container} from "@/lib/server/container";
import {createServerFn} from "@tanstack/react-start";
import {MediaType, UpdateType} from "@/lib/server/utils/enums";
import {authMiddleware} from "@/lib/server/middlewares/authentication";


export const postUpdateUserMedia = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator((data: any) => {
        return data as { mediaType: MediaType, mediaId: number, payload: Record<string, any>, updateType: UpdateType };
    })
    .handler(async ({ data, context: { currentUser } }) => {
        const { mediaType, mediaId, payload, updateType } = data;

        const userStatsService = container.services.userStats;
        const userUpdatesService = container.services.userUpdates;
        
        //@ts-expect-error
        const mediaService = container.registries.mediaService.getService(mediaType);

        const mediaDetails = await mediaService.getMinimalMediaDetails(mediaId);
        if (!mediaDetails) throw notFound();

        //@ts-expect-error
        const oldState = await mediaService.getUserMediaDetails(currentUser.id, mediaId);
        //@ts-expect-error
        const newState = await mediaService.updateUserMediaDetails(currentUser.id, mediaId, payload);
        const delta = mediaService.calculateDeltaStats(oldState, newState, mediaDetails);

        //@ts-expect-error
        await userStatsService.updateDeltaUserStats(mediaType, currentUser.id, delta);

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