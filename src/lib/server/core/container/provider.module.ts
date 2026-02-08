import {GBooksClient, HltbClient, IgdbClient, JikanClient, LlmClient, TmdbClient} from "@/lib/server/api-providers/clients";


export async function setupProviderModule() {
    // API Clients
    const [hltbClient, igdbClient, tmdbClient, jikanClient, gBookClient, llmClient] = await Promise.all([
        HltbClient.create(),
        IgdbClient.create(),
        TmdbClient.create(),
        JikanClient.create(),
        GBooksClient.create(),
        LlmClient.create(),
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
