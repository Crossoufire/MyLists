import {and, desc, eq} from "drizzle-orm";
import {db} from "@/lib/server/database/db";
import {userMediaUpdate} from "@/lib/server/database/schema";
import {MediaType, UpdateType} from "@/lib/server/utils/enums";
import {UserUpdatesRepository} from "@/lib/server/domain/user/repositories/user-updates.repository";


interface LogUpdateParams {
    media: any;
    oldValue: any,
    newValue: any,
    userId: number;
    mediaType: MediaType;
    updateType: UpdateType;
}


type LogValueExtractor = (oldState: any | null, newState: any) => { oldValue: any; newValue: any };


export class UserUpdatesService {
    private readonly updateThreshold = 300

    constructor(private userUpdatesRepository: typeof UserUpdatesRepository) {
    }

    async getUserUpdates(userId: number, limit = 8) {
        return this.userUpdatesRepository.getUserUpdates(userId, limit);
    }

    async getUserUpdatesPaginated(userId: number, filters: Record<string, any>) {
        return this.userUpdatesRepository.getUserUpdatesPaginated(userId, filters)
    }

    async getFollowsUpdates(userId: number, asPublic: boolean, limit = 10) {
        return this.userUpdatesRepository.getFollowsUpdates(userId, asPublic, limit);
    }

    async deleteUserUpdates(userId: number, updateIds: number[], returnData: boolean) {
        return this.userUpdatesRepository.deleteUserUpdates(userId, updateIds, returnData);
    }

    async logUpdate({ userId, mediaType, media, updateType, oldValue, newValue }: LogUpdateParams) {
        const [previousEntry] = await db.select()
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
            timeDifference = (new Date().getTime() - new Date(previousEntry.timestamp).getTime()) / 1000;
        }

        const newUpdateData = {
            userId: userId,
            mediaId: media.id,
            mediaType: mediaType,
            mediaName: media.name,
            updateType: updateType,
            payload: { oldValue, newValue },
            timestamp: new Date().toISOString()
        };

        if (timeDifference > this.updateThreshold) {
            await db.insert(userMediaUpdate).values(newUpdateData).execute();
        }
        else {
            await db.delete(userMediaUpdate).where(eq(userMediaUpdate.id, previousEntry.id)).execute();
            await db.insert(userMediaUpdate).values(newUpdateData).execute();
        }
    }

    extractLogValues(updateType: UpdateType) {
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
        return logValueExtractors[updateType];
    }
}
