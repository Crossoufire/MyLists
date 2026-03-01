import {serverEnv} from "@/env/server";
import {RateLimiterAbstract} from "rate-limiter-flexible";
import {createRateLimiter} from "@/lib/server/core/rate-limiter";
import {BaseApi} from "@/lib/server/api-providers/api/base.api";
import {GBooksDetails, GBooksSearchResults, SearchData} from "@/lib/types/provider.types";


export class GbooksApi extends BaseApi {
    private static readonly consumeKey = "gBooks-API";
    private readonly baseUrl = "https://www.googleapis.com/books/v1/volumes";
    private static readonly throttleOptions = { points: 4, duration: 1, keyPrefix: "gBooksAPI" };

    constructor(limiter: RateLimiterAbstract, consumeKey: string) {
        super(limiter, consumeKey);
    }

    public static async create() {
        const gBooksLimiter = await createRateLimiter(GbooksApi.throttleOptions);
        return new GbooksApi(gBooksLimiter, GbooksApi.consumeKey);
    }

    async search(query: string, page: number = 1): Promise<SearchData<GBooksSearchResults>> {
        const params = new URLSearchParams({
            q: query,
            key: serverEnv.GOOGLE_BOOKS_API_KEY,
            startIndex: ((page - 1) * this.resultsPerPage).toString(),
        });

        const response = await this.call(`${this.baseUrl}?${params.toString()}`);
        return {
            page,
            rawData: await response.json(),
            resultsPerPage: this.resultsPerPage,
        };
    }

    async getBooksDetails(bookApiId: string): Promise<GBooksDetails> {
        const url = `${this.baseUrl}/${bookApiId}?key=${serverEnv.GOOGLE_BOOKS_API_KEY}`;
        const response = await this.call(url);
        return response.json();
    }
}
