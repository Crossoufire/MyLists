import {RateLimiterAbstract} from "rate-limiter-flexible";
import {createRateLimiter} from "@/lib/server/core/rate-limiter";
import {BaseClient} from "@/lib/server/media-providers/clients/base.client";
import {SearchData} from "../../types/provider.types";
import {FormattedError} from "@/lib/server/utils/error-classes";


export class IgdbClient extends BaseClient {
    private static readonly consumeKey = "igdb-API";
    private readonly apiKey = process.env.IGDB_API_KEY!;
    private readonly secretId = process.env.SECRET_IGDB!;
    private readonly clientId = process.env.CLIENT_IGDB!;
    private readonly baseUrl = "https://api.igdb.com/v4/games";
    private readonly searchUrl = "https://api.igdb.com/v4/multiquery";
    private static readonly throttleOptions = { points: 4, duration: 1, keyPrefix: "igdbAPI" };
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

    async search(query: string, page: number = 1): Promise<SearchData> {
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

    async getGameDetails(apiId: number) {
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

        const rawData = await response.json();
        if (rawData.length === 0) {
            throw new FormattedError("Games not found");
        }

        return rawData[0] as Record<string, any>;
    }

    async updateToken() {
        const url = `https://id.twitch.tv/oauth2/token?client_id=${this.clientId}&client_secret=${this.secretId}&grant_type=client_credentials`
        const response = await this.call(url)
        return response.json();
    }
}
