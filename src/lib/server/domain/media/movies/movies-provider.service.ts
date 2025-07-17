import {TmdbClient} from "@/lib/server/api-providers/clients/tmdb.client";
import {MoviesRepository} from "@/lib/server/domain/media/movies/movies.repository";
import {TmdbTransformer} from "@/lib/server/api-providers/transformers/tmdb.transformer";
import {BaseTrendsProviderService} from "@/lib/server/domain/media/base/provider.service";
import {TmdbMovieDetails, TmdbTrendingMoviesResponse} from "@/lib/server/types/provider.types";


export class MoviesProviderService extends BaseTrendsProviderService<MoviesRepository> {
    constructor(
        private client: TmdbClient,
        private transformer: TmdbTransformer,
        repository: MoviesRepository,
    ) {
        super(repository);
    }

    protected _fetchRawDetails(apiId: number) {
        return this.client.getMovieDetails(apiId);
    }

    protected _transformDetails(rawData: TmdbMovieDetails) {
        return this.transformer.transformMoviesDetailsResults(rawData);
    }

    protected _getMediaIdsForBulkRefresh() {
        return this.repository.getMediaIdsToBeRefreshed();
    }

    protected _fetchRawTrends() {
        return this.client.getMoviesTrending();
    }

    protected _transformTrends(rawData: TmdbTrendingMoviesResponse) {
        return this.transformer.transformMoviesTrends(rawData);
    }
}