import {TmdbApi} from "@/lib/server/api-providers/api/tmdb.api";
import {MoviesRepository} from "@/lib/server/domain/media/movies/movies.repository";
import {UpsertMovieWithDetails} from "@/lib/server/domain/media/movies/movies.types";
import {TmdbMovieDetails, TmdbTrendingMoviesResponse} from "@/lib/types/provider.types";
import {tmdbTransformer} from "@/lib/server/api-providers/transformers/tmdb.transformer";
import {BaseTrendsProviderService} from "@/lib/server/domain/media/base/provider.service";


export class MoviesProviderService extends BaseTrendsProviderService<MoviesRepository, TmdbMovieDetails, UpsertMovieWithDetails> {
    constructor(private client: TmdbApi, repository: MoviesRepository) {
        super(repository);
    }

    protected _fetchRawDetails(apiId: number) {
        return this.client.getMovieDetails(apiId);
    }

    protected _transformDetails(rawData: TmdbMovieDetails) {
        return tmdbTransformer.transformMoviesDetailsResults(rawData);
    }

    protected _getMediaIdsForBulkRefresh() {
        return this.repository.getMediaIdsToBeRefreshed();
    }

    protected _fetchRawTrends() {
        return this.client.getMoviesTrending();
    }

    protected _transformTrends(rawData: TmdbTrendingMoviesResponse) {
        return tmdbTransformer.transformMoviesTrends(rawData);
    }
}
