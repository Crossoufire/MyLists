import {IgdbClient} from "@/lib/server/api-providers/clients/igdb.client";
import {TmdbClient} from "@/lib/server/api-providers/clients/tmdb.client";
import {HltbClient} from "@/lib/server/api-providers/clients/hltb.client";
import {JikanClient} from "@/lib/server/api-providers/clients/jikan.client";
import {GBooksClient} from "@/lib/server/api-providers/clients/gbooks.client";
import {LlmClient} from "@/lib/server/api-providers/clients/llm.client";
import {IgdbTransformer} from "@/lib/server/api-providers/transformers/igdb.transformer";
import {TmdbTransformer} from "@/lib/server/api-providers/transformers/tmdb.transformer";
import {JikanTransformer} from "@/lib/server/api-providers/transformers/jikan.transformer";
import {GBooksTransformer} from "@/lib/server/api-providers/transformers/gbook.transformer";


export async function setupApiModule() {
    // API Transformers
    const igdbTransformer = new IgdbTransformer();
    const tmdbTransformer = new TmdbTransformer();
    const gBookTransformer = new GBooksTransformer();
    const jikanTransformer = new JikanTransformer();

    // API Clients (Initialized concurrently with Promise.all)
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


export type ProviderModule = Awaited<ReturnType<typeof setupApiModule>>;
