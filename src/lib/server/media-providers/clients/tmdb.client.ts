import {RateLimiterAbstract} from "rate-limiter-flexible";
import {connectRedis} from "@/lib/server/core/redis-client";
import {createRateLimiter} from "@/lib/server/core/rate-limiter";
import {BaseClient} from "@/lib/server/media-providers/clients/base.client";


export class TmdbClient extends BaseClient {
    private static readonly consumeKey = "tmdb-API";
    private static readonly tvChangedIdsTtl = 60 * 5;
    private readonly apiKey = process.env.THEMOVIEDB_API_KEY;
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

    async search(query: string, page: number = 1) {
        const url = `${this.baseUrl}/search/multi?api_key=${this.apiKey}&query=${query}&page=${page}`;
        const response = await this.call(url);
        return response.json() as Record<string, any>;
    }

    async getMovieDetails(movieId: number) {
        const url = `${this.baseUrl}/movie/${movieId}?api_key=${this.apiKey}&append_to_response=credits`;
        const response = await this.call(url);
        return response.json();
    }

    async getTvDetails(tvId: number) {
        const url = `${this.baseUrl}/tv/${tvId}?api_key=${this.apiKey}`;
        const response = await this.call(url);
        return response.json();
    }

    async getTvTrending() {
        const url = `${this.baseUrl}/trending/tv/week?api_key=${this.apiKey}`;
        const response = await this.call(url);
        return response.json();
    }

    async getMoviesTrending() {
        const url = `${this.baseUrl}/trending/movie/week?api_key=${this.apiKey}`;
        const response = await this.call(url);
        return response.json();
    }

    async getTvChangedIds() {
        const redis = await connectRedis();

        // Try return cached data
        const cached = await redis?.get(TmdbClient.tvChangedIdsCacheKey);
        if (cached) {
            try {
                return JSON.parse(cached) as number[];
            }
            catch {
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
                const data: Record<string, any> = response.json();

                if (data && data.results) {
                    const ids = data.results
                        .map((item: any) => item.id)
                        .filter((id: any) => typeof id === "number") as number[];
                    changedApiIds.push(...ids);
                }

                totalPages = data.total_pages || 1;
                page += 1;
            }
            catch {
                break;
            }
        }

        // Try save data to cache
        await redis?.set(
            TmdbClient.tvChangedIdsCacheKey,
            JSON.stringify(changedApiIds),
            "EX",
            TmdbClient.tvChangedIdsTtl,
        );

        return changedApiIds;
    }
}
