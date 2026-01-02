import {serverEnv} from "@/env/server";
import {RateLimiterAbstract} from "rate-limiter-flexible";
import {createRateLimiter} from "@/lib/server/core/rate-limiter";
import {BaseClient} from "@/lib/server/api-providers/clients/base.client";
import {
    SearchData,
    TmdbChangesResponse,
    TmdbMovieDetails,
    TmdbMultiSearchResponse,
    TmdbTrendingMoviesResponse,
    TmdbTrendingTvResponse,
    TmdbTvDetails
} from "@/lib/types/provider.types";


export class TmdbClient extends BaseClient {
    private static readonly consumeKey = "tmdb-API";
    private static readonly tvChangedIdsTtl = 60 * 5;
    private readonly apiKey = serverEnv.THEMOVIEDB_API_KEY;
    private readonly baseUrl = "https://api.themoviedb.org/3";
    private static readonly tvChangedIdsCacheKey = "tmdb:tvChangedIds";
    private static readonly throttleOptions = { points: 30, duration: 1, keyPrefix: "tmdbAPI" };

    constructor(limiter: RateLimiterAbstract, consumeKey: string) {
        super(limiter, consumeKey);
    }

    public static async create() {
        const tmdbLimiter = await createRateLimiter(TmdbClient.throttleOptions);
        return new TmdbClient(tmdbLimiter, TmdbClient.consumeKey);
    }

    async search(query: string, page = 1): Promise<SearchData<TmdbMultiSearchResponse>> {
        const url = `${this.baseUrl}/search/multi?api_key=${this.apiKey}&query=${query}&page=${page}`;
        const response = await this.call(url);
        return {
            page,
            rawData: await response.json(),
            resultsPerPage: this.resultsPerPage,
        };
    }

    async getMovieDetails(movieId: number): Promise<TmdbMovieDetails> {
        const url = `${this.baseUrl}/movie/${movieId}?api_key=${this.apiKey}&append_to_response=credits`;
        const response = await this.call(url);
        return response.json();
    }

    async getTvDetails(tvId: number): Promise<TmdbTvDetails> {
        const url = `${this.baseUrl}/tv/${tvId}?api_key=${this.apiKey}&append_to_response=credits`;
        const response = await this.call(url);
        return response.json();
    }

    async getTvTrending(): Promise<TmdbTrendingTvResponse> {
        const url = `${this.baseUrl}/trending/tv/week?api_key=${this.apiKey}`;
        const response = await this.call(url);
        return response.json();
    }

    async getMoviesTrending(): Promise<TmdbTrendingMoviesResponse> {
        const url = `${this.baseUrl}/trending/movie/week?api_key=${this.apiKey}`;
        const response = await this.call(url);
        return response.json();
    }

    async getTvChangedIds() {
        const { connectRedis } = await import("@/lib/server/core/redis-client");

        const redisConnection = await connectRedis();
        const cached = await redisConnection?.get(TmdbClient.tvChangedIdsCacheKey);
        if (cached) {
            try {
                return JSON.parse(cached) as number[];
            }
            catch {
                // Ignore error and continue to fetch data from API
            }
        }

        // Fetch data from API
        let page = 1;
        let totalPages = 1;
        const changedApiIds: number[] = [];

        while (page <= Math.min(totalPages, 20)) {
            try {
                const url = `${this.baseUrl}/tv/changes?api_key=${this.apiKey}&page=${page}`
                const response = await this.call(url);
                const data: TmdbChangesResponse = await response.json();

                if (data && data.results) {
                    const ids = data.results.map(item => item.id);
                    changedApiIds.push(...ids);
                }

                totalPages = data.total_pages || 1;
                page += 1;
            }
            catch {
            }
        }

        // Try save data to cache
        await redisConnection?.set(
            TmdbClient.tvChangedIdsCacheKey,
            JSON.stringify(changedApiIds),
            "EX",
            TmdbClient.tvChangedIdsTtl,
        );

        return changedApiIds;
    }
}
