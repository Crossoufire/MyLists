import {and, desc, eq, sql} from "drizzle-orm";
import {userMediaUpdate} from "@/lib/server/database/schema";
import {AllUpdatesSearch} from "@/lib/server/types/base.types";
import {MediaType, UpdateType} from "@/lib/server/utils/enums";
import {getDbClient} from "@/lib/server/database/async-storage";
import {UserUpdatesRepository} from "@/lib/server/domain/user/repositories/user-updates.repository";


interface LogUpdateParams {
    ns: any;
    media: any;
    userId: number;
    os: any | null;
    mediaType: MediaType;
    updateType: UpdateType;
}


type LogValueExtractor = (oldState: any | null, newState: any) => { oldValue: any; newValue: any };


export class UserUpdatesService {
    private readonly updateThresholdSec = 300;

    constructor(private repository: typeof UserUpdatesRepository) {
    }

    async getUserUpdates(userId: number, limit = 8) {
        return this.repository.getUserUpdates(userId, limit);
    }

    async getUserMediaHistory(userId: number, mediaType: MediaType, mediaId: number) {
        return this.repository.getUserMediaHistory(userId, mediaType, mediaId);
    }

    async deleteMediaUpdatesForUser(userId: number, mediaType: MediaType, mediaId: number) {
        const updates = await this.repository.getUserMediaHistory(userId, mediaType, mediaId);
        const updateIds = updates.map((update) => update.id);
        await this.repository.deleteUserUpdates(userId, updateIds, false);
    }

    async deleteMediaUpdates(mediaType: MediaType, mediaIds: number[]) {
        return this.repository.deleteMediaUpdates(mediaType, mediaIds);
    }

    async getUserUpdatesPaginated(userId: number, filters: AllUpdatesSearch) {
        return this.repository.getUserUpdatesPaginated(userId, filters)
    }

    async getFollowsUpdates(userId: number, asPublic: boolean, limit = 10) {
        return this.repository.getFollowsUpdates(userId, asPublic, limit);
    }

    async deleteUserUpdates(userId: number, updateIds: number[], returnData: boolean) {
        return this.repository.deleteUserUpdates(userId, updateIds, returnData);
    }

    async logUpdate({ userId, mediaType, media, updateType, os, ns }: LogUpdateParams) {
        const { oldValue, newValue } = this.extractLogValues(updateType)(os, ns);

        const [previousEntry] = await getDbClient()
            .select()
            .from(userMediaUpdate).where(and(
                eq(userMediaUpdate.userId, userId),
                eq(userMediaUpdate.mediaId, media.id),
                eq(userMediaUpdate.mediaType, mediaType),
            ))
            .orderBy(desc(userMediaUpdate.timestamp))
            .limit(1)
            .execute()

        let timeDifference = Number.POSITIVE_INFINITY;
        if (previousEntry) {
            timeDifference = (Date.now() - new Date(previousEntry.timestamp + "Z").getTime()) / 1000;
        }

        const newUpdateData = {
            userId: userId,
            mediaId: media.id,
            mediaType: mediaType,
            mediaName: media.name,
            updateType: updateType,
            timestamp: sql<string>`datetime('now')`,
            payload: { old_value: oldValue, new_value: newValue },
        };

        if (timeDifference > this.updateThresholdSec) {
            await getDbClient().insert(userMediaUpdate).values(newUpdateData).execute();
        }
        else {
            await getDbClient().delete(userMediaUpdate).where(eq(userMediaUpdate.id, previousEntry.id)).execute();
            await getDbClient().insert(userMediaUpdate).values(newUpdateData).execute();
        }
    }

    extractLogValues(updateType: UpdateType) {
        const logValueExtractors: Record<UpdateType, LogValueExtractor> = {
            redo: (os, ns) => ({ oldValue: os?.redo ?? 0, newValue: ns.redo }),
            redoTv: (os, ns) => ({
                oldValue: os?.redo2.reduce((a: number, c: number) => a + c, 0) ?? 0,
                newValue: ns.redo2.reduce((a: number, c: number) => a + c, 0) ?? 0,
            }),
            status: (os, ns) => ({ oldValue: os?.status ?? null, newValue: ns.status }),
            playtime: (os, ns) => ({ oldValue: os?.playtime ?? 0, newValue: ns.playtime }),
            page: (os, ns) => ({ oldValue: os?.actualPage ?? null, newValue: ns.actualPage }),
            chapter: (os, ns) => ({ oldValue: os?.currentChapter ?? 0, newValue: ns.currentChapter }),
            tv: (os, ns) => ({
                oldValue: [os?.currentSeason ?? null, os?.lastEpisodeWatched ?? null],
                newValue: [ns.currentSeason, ns.lastEpisodeWatched],
            }),
        }

        return logValueExtractors[updateType];
    }
}
