import {GbooksApi, HltbApi, IgdbApi, JikanApi, LlmApi, TmdbApi} from "@/lib/server/api-providers/api";


export async function setupProviderModule() {
    // API Clients
    const [hltbClient, igdbClient, tmdbClient, jikanClient, gBookClient, llmClient] = await Promise.all([
        HltbApi.create(),
        IgdbApi.create(),
        TmdbApi.create(),
        JikanApi.create(),
        GbooksApi.create(),
        LlmApi.create(),
    ]);

    return {
        clients: {
            igdb: igdbClient,
            tmdb: tmdbClient,
            jikan: jikanClient,
            gBook: gBookClient,
            hltb: hltbClient,
            llmClient: llmClient,
        },
    };
}


export type ProviderModule = Awaited<ReturnType<typeof setupProviderModule>>;
