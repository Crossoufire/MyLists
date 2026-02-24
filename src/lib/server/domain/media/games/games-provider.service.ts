import {IgdbGameDetails} from "@/lib/types/provider.types";
import {HltbApi, IgdbApi} from "@/lib/server/api-providers/api";
import {GamesRepository} from "@/lib/server/domain/media/games/games.repository";
import {UpsertGameWithDetails} from "@/lib/server/domain/media/games/games.types";
import {BaseProviderService} from "@/lib/server/domain/media/base/provider.service";
import {igdbTransformer} from "@/lib/server/api-providers/transformers/igdb.transformer";


export class GamesProviderService extends BaseProviderService<GamesRepository, IgdbGameDetails, UpsertGameWithDetails> {
    constructor(private client: IgdbApi, repository: GamesRepository, private readonly hltbClient: HltbApi) {
        super(repository);
    }

    async checkHLTBWorks(gameName: string) {
        return this.hltbClient.search(gameName);
    }

    protected _fetchRawDetails(apiId: number) {
        return this.client.getGameDetails(apiId);
    }

    protected _transformDetails(rawData: IgdbGameDetails) {
        return igdbTransformer.transformDetailsResults(rawData);
    }

    protected _getMediaIdsForBulkRefresh(): Promise<(number | string)[]> {
        return this.repository.getMediaIdsToBeRefreshed();
    }

    protected _getBulkRefreshChunkSize() {
        return 500;
    }

    protected _fetchRawDetailsBatch(apiIds: (number | string)[]) {
        return this.client.getGamesDetails(apiIds as number[]);
    }

    protected async _enhanceDetails(details: UpsertGameWithDetails, isBulk: boolean) {
        if (!isBulk) {
            const hltbData = await this.hltbClient.search(details.mediaData.name);
            const extendedMediaData = igdbTransformer.addHLTBDataToMainDetails(hltbData, details.mediaData);
            return { ...details, mediaData: extendedMediaData };
        }

        return details;
    }
}
