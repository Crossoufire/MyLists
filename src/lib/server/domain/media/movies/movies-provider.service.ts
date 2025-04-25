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

    async processAndStoreMedia(apiId: number) {
        try {
            const rawData = await this.client.getMovieDetails(apiId);
            const { mediaData, actorsData, genresData } = await this.transformer.transformMoviesDetailsResults(rawData);
            return this.repository.storeMediaWithDetails({ mediaData, actorsData, genresData });
        }
        catch (error) {
            return null;
        }
    }

    async processAndRefreshMedia(apiId: number) {
        try {
            const rawData = await this.client.getMovieDetails(apiId);
            const { mediaData, actorsData, genresData } = await this.transformer.transformMoviesDetailsResults(rawData);
            return this.repository.updateMediaWithDetails({ mediaData, actorsData, genresData });
        }
        catch (error) {
            return false;
        }
    }

    async bulkProcessAndRefreshMedia() {
        // TODO: get all movies to be refreshed from database then refresh each movie using processAndStoreMedia
    }
}
