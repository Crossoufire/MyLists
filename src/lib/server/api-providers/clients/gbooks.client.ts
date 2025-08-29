import {RateLimiterAbstract} from "rate-limiter-flexible";
import {createRateLimiter} from "@/lib/server/core/rate-limiter";
import {BaseClient} from "@/lib/server/api-providers/clients/base.client";
import {GBooksDetails, GBooksSearchResults, SearchData} from "@/lib/types/provider.types";


export class GBooksClient extends BaseClient {
    private static readonly consumeKey = "gBooks-API";
    private readonly baseUrl = "https://www.googleapis.com/books/v1/volumes";
    private static readonly throttleOptions = { points: 4, duration: 1, keyPrefix: "gBooksAPI" };

    constructor(limiter: RateLimiterAbstract, consumeKey: string) {
        super(limiter, consumeKey);
    }

    public static async create() {
        const gBooksLimiter = await createRateLimiter(GBooksClient.throttleOptions);
        return new GBooksClient(gBooksLimiter, GBooksClient.consumeKey);
    }

    async search(query: string, page: number = 1): Promise<SearchData<GBooksSearchResults>> {
        const offset = (page - 1) * this.resultsPerPage;

        const url = `${this.baseUrl}?q=${query}&startIndex=${offset}`;
        const response = await this.call(url);

        return {
            page,
            rawData: await response.json(),
            resultsPerPage: this.resultsPerPage,
        };
    }

    async getBooksDetails(bookApiId: string): Promise<GBooksDetails> {
        const url = `${this.baseUrl}/${bookApiId}`;
        const response = await this.call(url);
        return response.json();
    }
}
