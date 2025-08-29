import {IgdbGameDetails} from "@/lib/types/provider.types";
import {HltbClient} from "@/lib/server/api-providers/clients/hltb.client";
import {IgdbClient} from "@/lib/server/api-providers/clients/igdb.client";
import {GamesRepository} from "@/lib/server/domain/media/games/games.repository";
import {UpsertGameWithDetails} from "@/lib/server/domain/media/games/games.types";
import {BaseProviderService} from "@/lib/server/domain/media/base/provider.service";
import {IgdbTransformer} from "@/lib/server/api-providers/transformers/igdb.transformer";


export class GamesProviderService extends BaseProviderService<GamesRepository> {
    constructor(
        private client: IgdbClient,
        private transformer: IgdbTransformer,
        repository: GamesRepository,
        private readonly hltbClient: HltbClient,
    ) {
        super(repository);
    }

    async fetchNewIgdbToken() {
        const response = await this.client.fetchNewIgdbToken();
        return response?.access_token;
    }

    protected _fetchRawDetails(apiId: number) {
        return this.client.getGameDetails(apiId);
    }

    protected _transformDetails(rawData: IgdbGameDetails) {
        return this.transformer.transformGamesDetailsResults(rawData);
    }

    protected _getMediaIdsForBulkRefresh(): Promise<(number | string)[]> {
        return this.repository.getMediaIdsToBeRefreshed();
    }

    protected async _enhanceDetails(details: UpsertGameWithDetails, isBulk: boolean) {
        if (!isBulk) {
            const hltbData = await this.hltbClient.search(details.mediaData.name);
            const extendedMediaData = this.transformer.addHLTBDataToMainDetails(hltbData, details.mediaData);
            return { ...details, mediaData: extendedMediaData };
        }

        return details;
    }
}