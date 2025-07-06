import {RateLimiterAbstract} from "rate-limiter-flexible";
import {createRateLimiter} from "@/lib/server/core/rate-limiter";
import {BaseClient} from "@/lib/server/media-providers/clients/base.client";


export class JikanClient extends BaseClient {
    private static readonly consumeKey = "jikan-API";
    private readonly animeUrl = "https://api.jikan.moe/v4/anime";
    private readonly mangaUrl = "https://api.jikan.moe/v4/manga";
    private static readonly throttleOptions = { points: 3, duration: 1, keyPrefix: "jikanAPI" };

    constructor(limiter: RateLimiterAbstract, consumeKey: string) {
        super(limiter, consumeKey);
    }

    public static async create() {
        const tmdbLimiter = await createRateLimiter(JikanClient.throttleOptions);
        return new JikanClient(tmdbLimiter, JikanClient.consumeKey);
    }

    async getAnimeGenresAndDemographics(animeName: string) {
        const url = `${this.animeUrl}?q=${animeName}`;
        const response = await this.call(url);
        return response.json();
    }
}
