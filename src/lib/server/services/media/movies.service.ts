import {MoviesRepository} from "@/lib/server/repositories/media/movies.repository";


export class MoviesService {
    constructor(
        private repository: MoviesRepository,
    ) {
    }

    async getMediaDetails(mediaId: number | string, external: boolean, strategy: any) {
        const media = external ? await this.repository.findByApiId(mediaId as string) : await this.repository.findById(mediaId as number);

        let mediaWithDetails;
        let internalMediaId = media?.id;

        if (external && !internalMediaId) {
            internalMediaId = await strategy.processAndStoreMedia(mediaId);
            if (!internalMediaId) {
                throw new Error("Failed to fetch media details");
            }
        }

        if (internalMediaId) {
            mediaWithDetails = await this.repository.findAllAssociatedDetails(internalMediaId);
        }
        else {
            throw new Error("Movie not found");
        }

        return mediaWithDetails;
    }

    async getUserMediaDetails(userId: number, mediaId: number) {
        return await this.repository.findUserMedia(userId, mediaId);
    }

    async getUserFollowsMediaData(userId: number, mediaId: number) {
        return await this.repository.getUserFollowsMediaData(userId, mediaId);
    }

    async getSimilarMedia(mediaId: number) {
        return await this.repository.findSimilarMedia(mediaId);
    }
}
