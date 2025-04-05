import {GamesRepository} from "@/lib/server/repositories/media/games.repository";


export class GamesService {
    constructor(
        private repository: GamesRepository,
    ) {
    }

    async getMediaDetails(mediaId: number, external: boolean, strategy: any) {
    }

    async getUserMediaDetails(userId: number, mediaId: number) {
    }

    async getUserFollowsMediaData(userId: number, mediaId: number) {
    }

    async getSimilarMedia(mediaId: number) {
    }
}