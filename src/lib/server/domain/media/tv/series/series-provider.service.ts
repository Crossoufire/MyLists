import {TvRepository} from "@/lib/server/domain/media/tv/tv.repository";
import {TmdbClient} from "@/lib/server/media-providers/clients/tmdb.client";
import {TmdbTransformer} from "@/lib/server/media-providers/transformers/tmdb.transformer";


export class SeriesProviderService {
    constructor(
        private client: TmdbClient,
        private transformer: TmdbTransformer,
        private repository: TvRepository,
    ) {
    }

    async fetchAndStoreMediaDetails(apiId: number) {
        const rawData = await this.client.getTvDetails(apiId);
        const { mediaData, genresData, seasonsData, actorsData, networkData } = await this.transformer.transformSeriesDetailsResults(rawData);
        return this.repository.storeMediaWithDetails({ mediaData, seasonsData, actorsData, networkData, genresData });
    }

    async fetchAndRefreshMediaDetails(apiId: number) {
        try {
            const rawData = await this.client.getTvDetails(apiId);
            const { mediaData, seasonsData, actorsData, networkData, genresData } = await this.transformer.transformSeriesDetailsResults(rawData);
            return this.repository.updateMediaWithDetails({ mediaData, seasonsData, actorsData, networkData, genresData });
        }
        catch (error: any) {
            error.message = `Error refreshing Series with apiId ${apiId}: ${error.message}`;
            throw error;
        }
    }

    async bulkProcessAndRefreshMedia() {
        const mediaToBeRefreshed = await this.repository.getMediaToBeRefreshed();
        const apiIds = mediaToBeRefreshed.map(m => m.apiId);

        const promises = [];
        for (const apiId of apiIds) {
            promises.push(this.fetchAndRefreshMediaDetails(apiId));
        }

        return Promise.allSettled(promises);
    }
}
