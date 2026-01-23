import {MediaType} from "@/lib/utils/enums";
import {LogUpdateParams} from "@/lib/types/base.types";
import {AllUpdatesSearch} from "@/lib/types/zod.schema.types";
import {UserUpdatesRepository} from "@/lib/server/domain/user/user-updates.repository";


export class UserUpdatesService {


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

    async getFollowsUpdates(profileOwnerId: number, visitorId?: number, limit = 10) {
        return this.repository.getFollowsUpdates(profileOwnerId, visitorId, limit);
    }

    async deleteUserUpdates(userId: number, updateIds: number[], returnData: boolean) {
        return this.repository.deleteUserUpdates(userId, updateIds, returnData);
    }

    async logUpdate({ userId, mediaType, media, updateType, payload }: LogUpdateParams) {
        await this.repository.logUpdate({ userId, mediaType, media, updateType, payload });
    }
}
