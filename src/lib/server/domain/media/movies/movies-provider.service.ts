import {TmdbClient} from "@/lib/server/media-providers/clients/tmdb.client";
import {MoviesRepository} from "@/lib/server/domain/media/movies/movies.repository";
import {TmdbTransformer} from "@/lib/server/media-providers/transformers/tmdb.transformer";


export class MoviesProviderService {
    constructor(
        private client: TmdbClient,
        private transformer: TmdbTransformer,
        private repository: MoviesRepository,
    ) {
    }

    async fetchAndStoreMediaDetails(apiId: number) {
        const rawData = await this.client.getMovieDetails(apiId);
        const { mediaData, actorsData, genresData } = await this.transformer.transformMoviesDetailsResults(rawData);
        return this.repository.storeMediaWithDetails({ mediaData, actorsData, genresData });
    }

    async fetchAndRefreshMediaDetails(apiId: number) {
        try {
            const rawData = await this.client.getMovieDetails(apiId);
            const { mediaData, actorsData, genresData } = await this.transformer.transformMoviesDetailsResults(rawData);
            return this.repository.updateMediaWithDetails({ mediaData, actorsData, genresData });
        }
        catch (error: any) {
            error.message = `Error refreshing movie with apiId ${apiId}: ${error.message}`;
            throw error;
        }
    }

    async bulkProcessAndRefreshMedia() {
        const mediaIdsToBeRefreshed = await this.repository.getMediaIdsToBeRefreshed();

        // const apiIds = [157336, 157336]
        const promises = [];
        for (const apiId of mediaIdsToBeRefreshed) {
            promises.push(this.fetchAndRefreshMediaDetails(apiId));
        }

        return Promise.allSettled(promises);
    }

    async fetchAndFormatTrends() {
        const rawData = await this.client.getMoviesTrending();
        const moviesTrends = this.transformer.transformMoviesTrends(rawData);
        return moviesTrends;
    }
}
