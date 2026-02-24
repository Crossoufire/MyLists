import {eq} from "drizzle-orm";
import {serverEnv} from "@/env/server";
import {notFound} from "@tanstack/react-router";
import {ApiProviderType} from "@/lib/utils/enums";
import {apiTokens} from "@/lib/server/database/schema";
import {getContainer} from "@/lib/server/core/container";
import {RateLimiterAbstract} from "rate-limiter-flexible";
import {getDbClient} from "@/lib/server/database/async-storage";
import {createRateLimiter} from "@/lib/server/core/rate-limiter";
import {BaseApi} from "@/lib/server/api-providers/api/base.api";
import {IgdbGameDetails, IgdbSearchResponse, IgdbTokenResponse, SearchData} from "@/lib/types/provider.types";


export class IgdbApi extends BaseApi {
    private static readonly consumeKey = "igdb-API";
    private readonly clientId = serverEnv.IGDB_CLIENT_ID;
    private readonly secretId = serverEnv.IGDB_CLIENT_SECRET;
    private static readonly tokenCacheKey = "igdb:accessToken";
    private readonly baseUrl = "https://api.igdb.com/v4/games";
    private readonly searchUrl = "https://api.igdb.com/v4/multiquery";
    private static readonly tokenCacheExpiryMs = 24 * 60 * 60 * 1000; // 1 day in ms
    private static readonly throttleOptions = { points: 3, duration: 1, keyPrefix: "igdbAPI" };

    constructor(limiter: RateLimiterAbstract, consumeKey: string) {
        super(limiter, consumeKey);
    }

    public static async create() {
        const igdbLimiter = await createRateLimiter(IgdbApi.throttleOptions);
        return new IgdbApi(igdbLimiter, IgdbApi.consumeKey);
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

        const headers = await this.getHeaders();
        const response = await this.call(this.searchUrl, "post", { headers, body: data });
        return {
            page,
            rawData: await response.json(),
            resultsPerPage: this.resultsPerPage,
        }
    }

    async getGameDetails(apiId: number): Promise<IgdbGameDetails> {
        const body = `
            fields name, cover.image_id, game_engines.name, game_modes.name, platforms.name, genres.name, 
            player_perspectives.name, total_rating, total_rating_count, first_release_date, 
            involved_companies.company.name, involved_companies.developer, involved_companies.publisher,
            summary, themes.name, url, external_games.uid, external_games.external_game_source;
            where id = ${apiId};
        `;

        const headers = await this.getHeaders();
        const response = await this.call(`${this.baseUrl}`, "post", { headers, body });

        const rawData = await response.json() as IgdbGameDetails[];
        if (rawData.length === 0) throw notFound();

        return rawData[0];
    }

    async getGamesDetails(apiIds: number[]): Promise<IgdbGameDetails[]> {
        if (apiIds.length === 0) return [];

        const body = `
            fields name, cover.image_id, game_engines.name, game_modes.name, platforms.name, genres.name, 
            player_perspectives.name, total_rating, total_rating_count, first_release_date, 
            involved_companies.company.name, involved_companies.developer, involved_companies.publisher,
            summary, themes.name, url, external_games.uid, external_games.external_game_source;
            where id = (${apiIds.join(",")});
            limit ${apiIds.length};
        `;

        const headers = await this.getHeaders();
        const response = await this.call(`${this.baseUrl}`, "post", { headers, body });
        return await response.json() as Promise<IgdbGameDetails[]>;
    }

    async refreshAccessToken() {
        const tokenResponse = await this.fetchNewIgdbToken();

        const accessToken = tokenResponse?.access_token;
        if (!accessToken) throw new Error("IGDB API returned an empty access token");

        const expiresAt = new Date(Date.now() + (tokenResponse.expires_in ?? 0) * 1000);
        await getDbClient()
            .insert(apiTokens)
            .values({
                expiresAt,
                accessToken,
                provider: ApiProviderType.IGDB,
            })
            .onConflictDoUpdate({
                target: apiTokens.provider,
                set: { accessToken, expiresAt },
            });

        const cacheStore = await getContainer().then((c) => c.cacheManager);
        const ttlMs = Math.max(expiresAt.getTime() - Date.now() - IgdbApi.tokenCacheExpiryMs, 0);
        if (ttlMs > 0) {
            await cacheStore.set(IgdbApi.tokenCacheKey, accessToken, ttlMs);
        }

        return accessToken;
    }

    async fetchNewIgdbToken(): Promise<IgdbTokenResponse> {
        const url = `https://id.twitch.tv/oauth2/token?client_id=${this.clientId}&client_secret=${this.secretId}&grant_type=client_credentials`;
        const response = await this.call(url, "post");
        return response.json();
    }

    private async getHeaders() {
        const accessToken = await this.getAccessToken();

        return {
            "Client-ID": this.clientId,
            "Accept": "application/json",
            "Content-Type": "text/plain",
            "Authorization": `Bearer ${accessToken}`,
        };
    }

    private async getAccessToken() {
        const cacheStore = await getContainer().then((c) => c.cacheManager);

        const cachedToken = await cacheStore.get<string>(IgdbApi.tokenCacheKey);
        if (cachedToken) return cachedToken;

        const existingToken = getDbClient()
            .select({
                expiresAt: apiTokens.expiresAt,
                accessToken: apiTokens.accessToken,
            })
            .from(apiTokens)
            .where(eq(apiTokens.provider, ApiProviderType.IGDB))
            .get();

        if (existingToken) {
            const msLeft = existingToken.expiresAt.getTime() - Date.now();
            if (msLeft > IgdbApi.tokenCacheExpiryMs) {
                const ttlMs = Math.max(msLeft - IgdbApi.tokenCacheExpiryMs, 0);
                if (ttlMs > 0) {
                    await cacheStore.set(IgdbApi.tokenCacheKey, existingToken.accessToken, ttlMs);
                }

                return existingToken.accessToken;
            }
        }

        return this.refreshAccessToken();
    }
}
