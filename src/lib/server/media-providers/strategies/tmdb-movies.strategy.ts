import {TmdbClient} from "@/lib/server/media-providers/clients/tmdb.client";
import {MoviesRepository} from "@/lib/server/repositories/media/movies.repository";
import {TmdbTransformer} from "@/lib/server/media-providers/transformers/tmdb.transformer";


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
            const { mediaData, actorsData, genresData } = await this.transformer.transformDetailsResults(rawData);
            return this.repository.storeMediaWithDetails({ mediaData, actorsData, genresData });
        }
        catch (error) {
            return null;
        }
    }
}
