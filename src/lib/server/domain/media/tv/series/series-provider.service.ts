import {TvRepository} from "@/lib/server/domain/media/tv/tv.repository";
import {TmdbClient} from "@/lib/server/media-providers/clients/tmdb.client";
import {TrendsProviderService} from "@/lib/server/domain/media/base/provider.service";
import {TmdbTransformer} from "@/lib/server/media-providers/transformers/tmdb.transformer";


export class SeriesProviderService extends TrendsProviderService {
    constructor(
        private client: TmdbClient,
        private transformer: TmdbTransformer,
        private repository: TvRepository,
    ) {
        super();
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
        const changedApiIds = await this.client.getTvChangedIds();
        const mediaIds = await this.repository.getMediaIdsToBeRefreshed(changedApiIds);

        const promises = [];
        for (const apiId of mediaIds) {
            promises.push(this.fetchAndRefreshMediaDetails(apiId));
        }

        return Promise.allSettled(promises);
    }

    async fetchAndFormatTrends() {
        const rawData = await this.client.getTvTrending();
        const tvTrends = this.transformer.transformSeriesTrends(rawData);
        return tvTrends;
    }
}
