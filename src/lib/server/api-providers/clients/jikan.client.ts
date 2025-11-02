import {RateLimiterAbstract} from "rate-limiter-flexible";
import {createRateLimiter} from "@/lib/server/core/rate-limiter";
import {BaseClient} from "@/lib/server/api-providers/clients/base.client";
import {JikanAnimeSearchResponse, JikanDetails, JikanMangaSearchResponse, SearchData} from "@/lib/types/provider.types";


export class JikanClient extends BaseClient {
    private static readonly consumeKey = "jikan-API";
    private readonly animeUrl = "https://api.jikan.moe/v4/anime";
    private readonly mangaUrl = "https://api.jikan.moe/v4/manga";
    private static readonly perSecThrottle = { points: 3, duration: 1, keyPrefix: "jikanAPI-sec" };
    private static readonly perMinThrottle = { points: 60, duration: 60, keyPrefix: "jikanAPI-min" };

    constructor(limiters: RateLimiterAbstract[], consumeKey: string) {
        super(limiters, consumeKey);
    }

    public static async create() {
        const [perSecondLimiter, perMinuteLimiter] = await Promise.all([
            createRateLimiter(JikanClient.perSecThrottle),
            createRateLimiter(JikanClient.perMinThrottle),
        ]);

        return new JikanClient([perSecondLimiter, perMinuteLimiter], JikanClient.consumeKey);
    }

    async search(query: string, page: number = 1): Promise<SearchData<JikanMangaSearchResponse>> {
        const url = `${this.mangaUrl}?q=${query}&page=${page}`;
        const response = await this.call(url);
        return {
            page,
            rawData: await response.json(),
            resultsPerPage: this.resultsPerPage,
        };
    }

    async getMangaDetails(mangaId: number): Promise<JikanDetails> {
        const url = `${this.mangaUrl}/${mangaId}/full`;
        const response = await this.call(url);
        const data = await response.json();
        return data.data;
    }

    async getAnimeGenresAndDemographics(animeName: string): Promise<JikanAnimeSearchResponse> {
        const url = `${this.animeUrl}?q=${animeName}`;
        const response = await this.call(url);
        return response.json();
    }
}
