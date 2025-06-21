import {TvRepository} from "@/lib/server/domain/media/tv/tv.repository";
import {TmdbClient} from "@/lib/server/media-providers/clients/tmdb.client";
import {TmdbTransformer} from "@/lib/server/media-providers/transformers/tmdb.transformer";


export class AnimeProviderService {
    constructor(
        private client: TmdbClient,
        private transformer: TmdbTransformer,
        private repository: TvRepository,
    ) {
    }

    async fetchAndStoreMediaDetails(apiId: number, isBulk: boolean = false) {
        const rawData = await this.client.getTvDetails(apiId);
        const { mediaData, actorsData, seasonsData, networkData, genresData } = await this.transformer.transformAnimeDetailsResults(rawData);
        // TODO: ADD function to get Jikan Genres data if not isBulk
        return this.repository.storeMediaWithDetails({ mediaData, actorsData, seasonsData, networkData, genresData });
    }

    async fetchAndRefreshMediaDetails(apiId: number, isBulk: boolean = false) {
        try {
            const rawData = await this.client.getTvDetails(apiId);
            const { mediaData, actorsData, seasonsData, networkData, genresData } = await this.transformer.transformAnimeDetailsResults(rawData);
            // TODO: ADD function to get Jikan Genres data if not isBulk
            return this.repository.updateMediaWithDetails({ mediaData, actorsData, seasonsData, networkData, genresData });
        }
        catch (error: any) {
            error.message = `Error refreshing Anime with apiId ${apiId}: ${error.message}`;
            throw error;
        }
    }

    // TODO: NEED TO BE CHANGED, USES THE API DIRECTLY
    async bulkProcessAndRefreshMedia() {
        const mediaToBeRefreshed = await this.repository.getMediaToBeRefreshed();
        const apiIds = mediaToBeRefreshed.map(m => m.apiId);

        const promises = [];
        for (const apiId of apiIds) {
            promises.push(this.fetchAndRefreshMediaDetails(apiId, true));
        }

        return Promise.allSettled(promises);
    }
}
