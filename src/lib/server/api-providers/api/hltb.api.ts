import UserAgent from "user-agents";
import {closest} from "@/lib/utils/levenshtein";
import {RateLimiterAbstract} from "rate-limiter-flexible";
import {createRateLimiter} from "@/lib/server/core/rate-limiter";
import {BaseApi} from "@/lib/server/api-providers/api/base.api";
import {HltbApiResponse, HltbGameEntry} from "@/lib/types/provider.types";


export class HltbApi extends BaseApi {
    private static readonly consumeKey = "hltb-API";
    private static readonly baseUrl = "https://howlongtobeat.com/";
    private static searchUrl = HltbApi.baseUrl + "api/finder/"
    private static tokenUrl = HltbApi.baseUrl + "api/finder/init";
    private static readonly throttleOptions = { points: 4, duration: 1, keyPrefix: "hltbAPI" };

    constructor(limiter: RateLimiterAbstract, consumeKey: string) {
        super(limiter, consumeKey);
    }

    public static async create() {
        const hltbLimiter = await createRateLimiter(HltbApi.throttleOptions);
        return new HltbApi(hltbLimiter, HltbApi.consumeKey);
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
        const headers: Record<string, string> = {
            "accept": "*/*",
            "User-Agent": ua.toString(),
            "referer": HltbApi.baseUrl,
            "content-type": "application/json",
        };

        const authToken = await this._getAuthToken();
        if (authToken) {
            headers["x-auth-token"] = authToken;
        }

        try {
            const payload = this._getSearchPayload(gameName);
            const response = await fetch(HltbApi.searchUrl, {
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
    }

    private async _getAuthToken() {
        const ua = new UserAgent();
        const headers = {
            "User-Agent": ua.toString(),
            "referer": HltbApi.baseUrl,
        };

        try {
            const response = await fetch(`${HltbApi.tokenUrl}?t=${Date.now()}`, { method: "GET", headers });
            if (response.ok) {
                const data = await response.json();
                const token = data?.token ?? data?.data?.token;
                return String(token);
            }
            else {
                console.error("Request failed with status", response.status);
            }
        }
        catch (err) {
            console.error("Error fetching auth token:", err);
        }
    }

    // private async _getSearchInfo(searchAll: boolean) {
    //     const ua = new UserAgent();
    //     const headers = {
    //         "User-Agent": ua.toString(),
    //         "referer": HltbClient.baseUrl,
    //     }
    //
    //     try {
    //         const response = await fetch(HltbClient.baseUrl, { method: "GET", headers });
    //         if (!response.ok) return;
    //
    //         const htmlResult = await response.text();
    //         console.log("Got HTML result:", htmlResult);
    //
    //         const $ = cheerio.load(htmlResult);
    //         const scripts = $("script[src]");
    //         console.log("Found scripts:", scripts.length);
    //
    //         const matchingScripts: string[] = [];
    //         scripts.each((_, elem) => {
    //             const src = $(elem).attr("src");
    //             console.log("Found script:", src);
    //             if (src && (searchAll || src.includes("_app-"))) {
    //                 matchingScripts.push(src);
    //             }
    //         });
    //
    //         for (const scriptUrl of matchingScripts) {
    //             try {
    //                 const scriptResponse = await fetch(`${HltbClient.baseUrl}${scriptUrl}`, { headers, method: "GET" });
    //                 if (scriptResponse.ok) {
    //                     const scriptContent = await scriptResponse.text();
    //                     let searchUrl = this._extractSearchUrlFromScript(scriptContent);
    //                     if (searchUrl && HltbClient.baseUrl.endsWith("/")) {
    //                         searchUrl = searchUrl.replace(/^\/+/, "");
    //                     }
    //                     return searchUrl;
    //                 }
    //             }
    //             catch (err) {
    //                 console.warn(`Failed to fetch script ${scriptUrl}:`, err);
    //             }
    //         }
    //     }
    //     catch (err) {
    //         console.error("Error getting search info:", err);
    //     }
    // }

    // private _extractSearchUrlFromScript(scriptContent: string) {
    //     const pattern = new RegExp(
    //         String.raw`fetch\s*\(\s*["']/api/([a-zA-Z0-9_/]+)[^"']*["']\s*,\s*{[^}]*method:\s*["']POST["'][^}]*}`,
    //         "gis",
    //     );
    //
    //     const match = pattern.exec(scriptContent);
    //     if (match) {
    //         const pathSuffix = match[1];
    //         const basePath = pathSuffix.includes("/") ? pathSuffix.split("/")[0] : pathSuffix;
    //         if (basePath !== "find") {
    //             return `/api/${basePath}`;
    //         }
    //     }
    //
    //     return;
    // }

    private _getSearchPayload(gameName: string) {
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

        return payload;
    }
}
