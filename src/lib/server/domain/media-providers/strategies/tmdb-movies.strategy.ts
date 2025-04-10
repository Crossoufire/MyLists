import {TmdbClient} from "@/lib/server/domain/media-providers/clients/tmdb.client";
import {MoviesRepository} from "@/lib/server/domain/media/movies/movies.repository";
import {TmdbTransformer} from "@/lib/server/domain/media-providers/transformers/tmdb.transformer";


export class TmdbMoviesStrategy {
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
        // TODO: Implement refreshing of media details
    }
}
