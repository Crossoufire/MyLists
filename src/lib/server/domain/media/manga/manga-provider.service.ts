import {JikanDetails} from "@/lib/types/provider.types";
import {JikanApi} from "@/lib/server/api-providers/api/jikan.api";
import {MangaRepository} from "@/lib/server/domain/media/manga/manga.repository";
import {UpsertMangaWithDetails} from "@/lib/server/domain/media/manga/manga.types";
import {BaseProviderService} from "@/lib/server/domain/media/base/provider.service";
import {jikanTransformer} from "@/lib/server/api-providers/transformers/jikan.transformer";


export class MangaProviderService extends BaseProviderService<MangaRepository, JikanDetails, UpsertMangaWithDetails> {
    constructor(private client: JikanApi, repository: MangaRepository) {
        super(repository);
    }

    protected _fetchRawDetails(apiId: number) {
        return this.client.getMangaDetails(apiId);
    }

    protected _transformDetails(rawData: JikanDetails) {
        return jikanTransformer.transformDetailsResults(rawData);
    }

    protected _getMediaIdsForBulkRefresh() {
        return this.repository.getMediaIdsToBeRefreshed();
    }
}
