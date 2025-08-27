import {JikanDetails} from "@/lib/server/types/provider.types";
import {JikanClient} from "@/lib/server/api-providers/clients/jikan.client";
import {MangaRepository} from "@/lib/server/domain/media/manga/manga.repository";
import {BaseProviderService} from "@/lib/server/domain/media/base/provider.service";
import {JikanTransformer} from "@/lib/server/api-providers/transformers/jikan.transformer";


export class MangaProviderService extends BaseProviderService<MangaRepository> {
    constructor(
        private client: JikanClient,
        private transformer: JikanTransformer,
        repository: MangaRepository,
    ) {
        super(repository);
    }

    protected _fetchRawDetails(apiId: number) {
        return this.client.getMangaDetails(apiId);
    }

    protected _transformDetails(rawData: JikanDetails) {
        return this.transformer.transformMangaDetailsResults(rawData);
    }

    protected _getMediaIdsForBulkRefresh(): Promise<(number | string)[]> {
        return Promise.all([]);
    }
}
