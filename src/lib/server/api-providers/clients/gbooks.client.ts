import {RateLimiterAbstract} from "rate-limiter-flexible";
import {createRateLimiter} from "@/lib/server/core/rate-limiter";
import {BaseClient} from "@/lib/server/api-providers/clients/base.client";
import {SearchData, TmdbMultiSearchResponse, TmdbTvDetails} from "@/lib/server/types/provider.types";


export class GBooksClient extends BaseClient {
    private static readonly consumeKey = "gBooks-API";
    private readonly baseUrl = "https://api.themoviedb.org/3";
    private static readonly throttleOptions = { points: 4, duration: 1, keyPrefix: "gBooksAPI" };

    constructor(limiter: RateLimiterAbstract, consumeKey: string) {
        super(limiter, consumeKey);
    }

    public static async create() {
        const gBooksLimiter = await createRateLimiter(GBooksClient.throttleOptions);
        return new GBooksClient(gBooksLimiter, GBooksClient.consumeKey);
    }

    async search(query: string, page: number = 1): Promise<SearchData<TmdbMultiSearchResponse>> {
        const url = `${this.baseUrl}/search/multi?api_key=${this.apiKey}&query=${query}&page=${page}`;
        const response = await this.call(url);
        return {
            page,
            rawData: await response.json(),
            resultsPerPage: this.resultsPerPage,
        };
    }

    async getBooksDetails(bookApiId: string): Promise<TmdbTvDetails> {
        const url = `${this.baseUrl}/${bookApiId}`;
        const response = await this.call(url);
        return response.json();
    }
}
