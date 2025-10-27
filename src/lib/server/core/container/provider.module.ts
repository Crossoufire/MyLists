import {GBooksClient, HltbClient, IgdbClient, JikanClient, LlmClient, TmdbClient,} from "@/lib/server/api-providers/clients";
import {GBooksTransformer, IgdbTransformer, JikanTransformer, TmdbTransformer,} from "@/lib/server/api-providers/transformers";


export async function setupProviderModule() {
    // API Transformers
    const igdbTransformer = new IgdbTransformer();
    const tmdbTransformer = new TmdbTransformer();
    const gBookTransformer = new GBooksTransformer();
    const jikanTransformer = new JikanTransformer();

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
        transformers: {
            igdb: igdbTransformer,
            tmdb: tmdbTransformer,
            jikan: jikanTransformer,
            gBook: gBookTransformer,
        },
    };
}


export type ProviderModule = Awaited<ReturnType<typeof setupProviderModule>>;
