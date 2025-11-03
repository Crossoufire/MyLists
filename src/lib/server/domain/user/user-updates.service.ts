import {and, desc, eq} from "drizzle-orm";
import {LogPayloadDb} from "@/lib/types/base.types";
import {MediaType, UpdateType} from "@/lib/utils/enums";
import {userMediaUpdate} from "@/lib/server/database/schema";
import {AllUpdatesSearch} from "@/lib/types/zod.schema.types";
import {getDbClient} from "@/lib/server/database/async-storage";
import {UserUpdatesRepository} from "@/lib/server/domain/user/user-updates.repository";


interface LogUpdateParams {
    media: any;
    userId: number;
    payload: LogPayloadDb;
    mediaType: MediaType;
    updateType: UpdateType;
}


export class UserUpdatesService {
    private readonly updateThresholdSec = 300;

    constructor(private repository: typeof UserUpdatesRepository) {
    }

    async getUserUpdates(userId: number, limit = 6) {
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

    async logUpdate({ userId, mediaType, media, updateType, payload }: LogUpdateParams) {
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
            userId,
            payload,
            mediaType,
            updateType,
            mediaId: media.id,
            mediaName: media.name,
        };

        if (timeDifference > this.updateThresholdSec) {
            await getDbClient()
                .insert(userMediaUpdate)
                .values(newUpdateData)
                .execute();
        }
        else {
            await getDbClient()
                .delete(userMediaUpdate)
                .where(eq(userMediaUpdate.id, previousEntry.id))
                .execute();

            await getDbClient()
                .insert(userMediaUpdate)
                .values(newUpdateData)
                .execute();
        }
    }
}
