import * as cheerio from "cheerio";
import UserAgent from "user-agents";
import {closest} from "@/lib/utils/levenshtein";
import {RateLimiterAbstract} from "rate-limiter-flexible";
import {createRateLimiter} from "@/lib/server/core/rate-limiter";
import {BaseClient} from "@/lib/server/api-providers/clients/base.client";
import {HltbApiResponse, HltbGameEntry, SearchInfo} from "@/lib/types/provider.types";


export class HltbClient extends BaseClient {
    private static readonly consumeKey = "hltb-API";
    private static readonly baseUrl = "https://howlongtobeat.com/";
    private static readonly throttleOptions = { points: 4, duration: 1, keyPrefix: "hltbAPI" };
    private static searchUrl = HltbClient.baseUrl + "api/s/"

    constructor(limiter: RateLimiterAbstract, consumeKey: string) {
        super(limiter, consumeKey);
    }

    public static async create() {
        const hltbLimiter = await createRateLimiter(HltbClient.throttleOptions);
        return new HltbClient(hltbLimiter, HltbClient.consumeKey);
    }

    async search(gameName: string) {
        const defaultEntry: HltbGameEntry = {
            name: gameName,
            mainStory: null,
            mainExtra: null,
            completionist: null,
        };

        try {
            const htmlResult = await this._sendWebRequest(gameName);
            if (!htmlResult) return defaultEntry;

            const gamesList = this._parseGameResults(htmlResult);
            if (gamesList.length === 0) return defaultEntry;

            const closestGameName = closest(gameName, gamesList.map((g) => g.name));
            const game = gamesList.find((g) => g.name === closestGameName);

            return game || defaultEntry;
        }
        catch (err) {
            console.error(`Error when searching for game ${gameName}:`, err);
            return defaultEntry;
        }
    }

    private _parseGameResults(htmlResult: string) {
        try {
            const response: HltbApiResponse = JSON.parse(htmlResult);
            return response.data
                .filter((game) => game.game_name)
                .map((game) => ({
                    name: game.game_name!,
                    mainStory: game.comp_main ? (game.comp_main / 3600).toFixed(2) : undefined,
                    mainExtra: game.comp_plus ? (game.comp_plus / 3600).toFixed(2) : undefined,
                    completionist: game.comp_100 ? (game.comp_100 / 3600).toFixed(2) : undefined,
                } as HltbGameEntry));
        }
        catch (err) {
            console.error("Error parsing game results:", err);
            return [];
        }
    }

    private async _sendWebRequest(gameName: string) {
        const ua = new UserAgent();
        const headers = {
            "accept": "*/*",
            "User-Agent": ua.toString(),
            "referer": HltbClient.baseUrl,
            "content-type": "application/json",
        };

        const searchInfo = await this._getSearchInfo(false);
        if (!searchInfo?.apiKey) {
            console.warn("Could not extract API key");
            return null;
        }

        if (searchInfo.searchUrl) {
            HltbClient.searchUrl = `${HltbClient.baseUrl}${searchInfo.searchUrl}`;
        }

        try {
            const payload = this._getSearchPayload(gameName);
            const response = await fetch(`${HltbClient.searchUrl}${searchInfo.apiKey}`, {
                headers,
                method: "POST",
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                return await response.text();
            }
        }
        catch (err) {
            console.warn("First request failed, trying alternative:", err);
        }

        // Fallback - try with API key in payload
        const payloadWithApiKey = this._getSearchPayload(gameName, searchInfo);
        try {
            const response = await fetch(HltbClient.searchUrl, {
                headers,
                method: "POST",
                body: JSON.stringify(payloadWithApiKey),
            });

            return response.ok ? await response.text() : null;
        }
        catch (err) {
            console.error("Both requests failed:", err);
            return null;
        }
    }

    private async _getSearchInfo(searchAll: boolean) {
        const ua = new UserAgent();
        const headers = {
            "User-Agent": ua.toString(),
            "referer": HltbClient.baseUrl,
        }

        try {
            const response = await fetch(HltbClient.baseUrl, { method: "GET", headers });
            if (!response.ok) return null;

            const htmlResult = await response.text();
            const $ = cheerio.load(htmlResult);
            const scripts = $("script[src]");
            const matchingScripts: string[] = [];

            scripts.each((_, elem) => {
                const src = $(elem).attr("src");
                if (src && (searchAll || src.includes("_app-"))) {
                    matchingScripts.push(src);
                }
            });

            for (const scriptUrl of matchingScripts) {
                try {
                    const scriptResponse = await fetch(`${HltbClient.baseUrl}${scriptUrl}`, { headers, method: "GET" });
                    if (scriptResponse.ok) {
                        const searchInfo = this._extractSearchInfo(await scriptResponse.text());
                        if (searchInfo.apiKey) return searchInfo;
                    }
                }
                catch (err) {
                    console.warn(`Failed to fetch script ${scriptUrl}:`, err);
                }
            }

            return null;
        }
        catch (err) {
            console.error("Error getting search info:", err);
            return null;
        }
    }

    private _extractSearchInfo(scriptContent: string) {
        const apiKey = this._extractApiFromScript(scriptContent);
        let searchUrl = this._extractSearchUrlFromScript(scriptContent, apiKey);

        if (searchUrl && HltbClient.baseUrl.endsWith("/")) {
            searchUrl = searchUrl.replace(/^\/+/, "");
        }

        return { apiKey, searchUrl };
    }

    private _extractApiFromScript(scriptContent: string) {
        // Test 1 - The API Key is in the user id in the request json
        const pattern = /users\s*:\s*{\s*id\s*:\s*"([^"]+)"/g;
        let matches = scriptContent.match(pattern);
        if (matches) {
            const apiKey = matches.map((m) => {
                const res = /users\s*:\s*{\s*id\s*:\s*"([^"]+)"/.exec(m);
                return res ? res[1] : "";
            }).join("");

            return apiKey;
        }

        // Test 2 - The API Key is in concat format
        const apiKeyPattern = /\/api\/\w+\/"(?:\.concat\("[^"]*"\))*/g;
        matches = scriptContent.match(apiKeyPattern);
        if (matches) {
            let splitMatches = matches.join("").split(".concat");
            splitMatches = splitMatches.slice(1).map((match) => match.replace(/["()[\]']/g, ''));
            return splitMatches.join("");
        }

        return;
    }

    private _extractSearchUrlFromScript(scriptContent: string, apiKey?: string) {
        if (!apiKey) return;

        const pattern = new RegExp(
            String.raw`fetch\(\s*["'](\/api\/[^"']*)["']` +
            String.raw`((?:\s*\.concat\(\s*["']([^"']*)["']\s*\))+)\s*,`,
            'gs'
        );

        const matches = scriptContent.matchAll(pattern);
        for (const match of matches) {
            const endpoint = match[1];
            const concatCalls = match[2];
            const concatStrings = Array.from(concatCalls.matchAll(/\.concat\(\s*["']([^"']*)["']\s*\)/g)).map((m) => m[1]);
            if (concatStrings.join("") === apiKey) {
                return endpoint;
            }
        }

        return;
    }

    private _getSearchPayload(gameName: string, searchInfo?: SearchInfo) {
        const payload = {
            size: 10,
            searchPage: 1,
            searchType: "games",
            searchTerms: gameName.split(" "),
            searchOptions: {
                games: {
                    userId: 0,
                    platform: "",
                    rangeCategory: "main",
                    sortCategory: "popular",
                    rangeTime: { min: 0, max: 0 },
                    rangeYear: { max: "", min: "" },
                    gameplay: {
                        flow: "",
                        genre: "",
                        difficulty: "",
                        perspective: "",
                    },
                },
                sort: 0,
                filter: "",
                randomizer: 0,
                lists: { sortCategory: "follows" },
                users: { sortCategory: "postcount" },
            },
            useCache: true,
        };

        if (searchInfo?.apiKey) {
            (payload.searchOptions.users as any).id = searchInfo.apiKey;
        }

        return payload;
    }
}
