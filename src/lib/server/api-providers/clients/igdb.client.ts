import {serverEnv} from "@/env/server";
import {notFound} from "@tanstack/react-router";
import {RateLimiterAbstract} from "rate-limiter-flexible";
import {createRateLimiter} from "@/lib/server/core/rate-limiter";
import {BaseClient} from "@/lib/server/api-providers/clients/base.client";
import {IgdbGameDetails, IgdbSearchResponse, IgdbTokenResponse, SearchData} from "@/lib/types/provider.types";


export class IgdbClient extends BaseClient {
    private static readonly consumeKey = "igdb-API";
    private readonly apiKey = serverEnv.IGDB_API_KEY;
    private readonly clientId = serverEnv.IGDB_CLIENT_ID;
    private readonly secretId = serverEnv.IGDB_CLIENT_SECRET;
    private readonly baseUrl = "https://api.igdb.com/v4/games";
    private readonly searchUrl = "https://api.igdb.com/v4/multiquery";
    private static readonly throttleOptions = { points: 1, duration: 0.28, keyPrefix: "igdbAPI" }; // 3.57req/s (max 4)
    private readonly headers = {
        "Client-ID": this.clientId,
        "Accept": "application/json",
        "Content-Type": "text/plain",
        "Authorization": `Bearer ${this.apiKey}`,
    };

    constructor(limiter: RateLimiterAbstract, consumeKey: string) {
        super(limiter, consumeKey);
    }

    public static async create() {
        const igdbLimiter = await createRateLimiter(IgdbClient.throttleOptions);
        return new IgdbClient(igdbLimiter, IgdbClient.consumeKey);
    }

    async search(query: string, page: number = 1): Promise<SearchData<IgdbSearchResponse>> {
        const offset = (page - 1) * this.resultsPerPage;

        const data = `
            query games/count "totalResults" {
                where name ~ *"${query}"*;
            };
            query games "results" {
                fields id, name, cover.image_id, first_release_date;
                limit ${this.resultsPerPage};
                offset ${offset};
                where name ~ *"${query}"*;
            };
        `;

        const response = await this.call(this.searchUrl, "post", { headers: this.headers, body: data });
        return {
            page,
            rawData: await response.json(),
            resultsPerPage: this.resultsPerPage,
        }
    }

    async getGameDetails(apiId: number): Promise<IgdbGameDetails> {
        const data = (
            "fields name, cover.image_id, game_engines.name, game_modes.name, platforms.name, genres.name, " +
            "player_perspectives.name, total_rating, total_rating_count, first_release_date, " +
            "involved_companies.company.name, involved_companies.developer, involved_companies.publisher, " +
            `summary, themes.name, url; where id = ${apiId};`
        )

        const response = await this.call(`${this.baseUrl}`, "post", {
            headers: this.headers,
            body: data,
        });

        const rawData = await response.json() as IgdbGameDetails[];
        if (rawData.length === 0) {
            throw notFound();
        }

        return rawData[0];
    }

    async fetchNewIgdbToken(): Promise<IgdbTokenResponse> {
        const url = `https://id.twitch.tv/oauth2/token?client_id=${this.clientId}&client_secret=${this.secretId}&grant_type=client_credentials`;
        const response = await this.call(url, "post");
        return response.json();
    }
}
