import {IgdbClient} from "@/lib/server/media-providers/clients/igdb.client";
import {GamesRepository} from "@/lib/server/domain/media/games/games.repository";
import {IgdbTransformer} from "@/lib/server/media-providers/transformers/igdb.transformer";


export class GamesProviderService {
    constructor(
        private client: IgdbClient,
        private transformer: IgdbTransformer,
        private repository: GamesRepository,
    ) {
    }

    async fetchAndStoreMediaDetails(apiId: number, isBulk: boolean = false) {
        const rawData = await this.client.getGameDetails(apiId);
        const { mediaData, genresData, companiesData, platformsData } = await this.transformer.transformGamesDetailsResults(rawData);
        // TODO: ADD function to get HLTB data if not isBulk
        return this.repository.storeMediaWithDetails({ mediaData, companiesData, platformsData, genresData });
    }

    async fetchAndRefreshMediaDetails(apiId: number, isBulk: boolean = false) {
        try {
            const rawData = await this.client.getGameDetails(apiId);
            const { mediaData, companiesData, platformsData, genresData } = await this.transformer.transformGamesDetailsResults(rawData);
            // TODO: ADD function to get HLTB data if not isBulk
            return this.repository.updateMediaWithDetails({ mediaData, companiesData, platformsData, genresData });
        }
        catch (error: any) {
            error.message = `Error refreshing game with apiId ${apiId}: ${error.message}`;
            throw error;
        }
    }

    async bulkProcessAndRefreshMedia() {
        const mediaToBeRefreshed = await this.repository.getMediaToBeRefreshed();
        const apiIds = mediaToBeRefreshed.map(m => m.apiId);

        const promises = [];
        for (const apiId of apiIds) {
            promises.push(this.fetchAndRefreshMediaDetails(apiId, true));
        }

        return Promise.allSettled(promises);
    }
}
