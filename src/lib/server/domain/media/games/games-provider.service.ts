import {FormattedError} from "@/lib/server/utils/error-classes";
import {IProviderService} from "@/lib/server/types/provider.types";
import {HltbClient} from "@/lib/server/media-providers/clients/hltb.client";
import {IgdbClient} from "@/lib/server/media-providers/clients/igdb.client";
import {GamesRepository} from "@/lib/server/domain/media/games/games.repository";
import {IgdbTransformer} from "@/lib/server/media-providers/transformers/igdb.transformer";


export class GamesProviderService implements IProviderService {
    constructor(
        private readonly client: IgdbClient,
        private readonly hltbClient: HltbClient,
        private readonly transformer: IgdbTransformer,
        private readonly repository: GamesRepository
    ) {
    }

    async fetchNewIgdbToken() {
        const response = await this.client.fetchNewIgdbToken();
        return response?.access_token;
    }

    async fetchAndStoreMediaDetails(apiId: number, isBulk: boolean = false) {
        const details = await this._getMediaDetails(apiId, isBulk);
        return this.repository.storeMediaWithDetails(details);
    }

    async fetchAndRefreshMediaDetails(apiId: number, isBulk: boolean = false) {
        try {
            const details = await this._getMediaDetails(apiId, isBulk);
            return this.repository.updateMediaWithDetails(details);
        }
        catch (err: any) {
            throw new FormattedError(`Game can't be refreshed`);
        }
    }

    async bulkProcessAndRefreshMedia() {
        const mediaIdsToBeRefreshed = await this.repository.getMediaIdsToBeRefreshed();
        const promises = mediaIdsToBeRefreshed.map((apiId) => this.fetchAndRefreshMediaDetails(apiId, true));

        return Promise.allSettled(promises);
    }

    private async _getMediaDetails(apiId: number, isBulk: boolean) {
        const rawData = await this.client.getGameDetails(apiId);
        const { mediaData, genresData, companiesData, platformsData } = await this.transformer.transformGamesDetailsResults(rawData);

        let extendedMediaData = mediaData;
        if (!isBulk) {
            const hltbData = await this.hltbClient.search(mediaData.name);
            console.log({ hltbData });
            extendedMediaData = this.transformer.addHLTBDataToMainDetails(hltbData, mediaData);
        }

        return { mediaData: extendedMediaData, companiesData, platformsData, genresData };
    }
}
