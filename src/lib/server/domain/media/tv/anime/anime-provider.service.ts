import {ProviderService} from "@/lib/server/domain/media/base/provider.service";
import {TvRepository} from "@/lib/server/domain/media/tv/tv.repository";
import {TmdbClient} from "@/lib/server/media-providers/clients/tmdb.client";
import {JikanClient} from "@/lib/server/media-providers/clients/jikan.client";
import {TmdbTransformer} from "@/lib/server/media-providers/transformers/tmdb.transformer";


export class AnimeProviderService extends ProviderService {
    constructor(
        private client: TmdbClient,
        private jikanClient: JikanClient,
        private transformer: TmdbTransformer,
        private repository: TvRepository,
    ) {
        super();
    }

    async fetchAndStoreMediaDetails(apiId: number, isBulk: boolean = false) {
        const rawData = await this.client.getTvDetails(apiId);
        const { mediaData, actorsData, seasonsData, networkData, genresData } = await this.transformer.transformAnimeDetailsResults(rawData);

        let extendedGenresData = genresData;
        if (!isBulk) {
            const jikanData = await this.jikanClient.getAnimeGenresAndDemographics(mediaData.name);
            extendedGenresData = this.transformer.addAnimeSpecificGenres(jikanData, genresData);
        }

        return this.repository.storeMediaWithDetails({ mediaData, actorsData, seasonsData, networkData, genresData: extendedGenresData });
    }

    async fetchAndRefreshMediaDetails(apiId: number, isBulk: boolean = false) {
        try {
            const rawData = await this.client.getTvDetails(apiId);
            const { mediaData, actorsData, seasonsData, networkData, genresData } = await this.transformer.transformAnimeDetailsResults(rawData);

            let extendedGenresData = genresData;
            if (isBulk) {
                extendedGenresData = null;
            }
            else {
                const jikanData = await this.jikanClient.getAnimeGenresAndDemographics(mediaData.name);
                extendedGenresData = this.transformer.addAnimeSpecificGenres(jikanData, genresData);
            }

            return this.repository.updateMediaWithDetails({ mediaData, actorsData, seasonsData, networkData, genresData: extendedGenresData });
        }
        catch (error: any) {
            error.message = `Error refreshing Anime with apiId ${apiId}: ${error.message}`;
            throw error;
        }
    }

    async bulkProcessAndRefreshMedia() {
        const changedApiIds = await this.client.getTvChangedIds();
        const mediaIds = await this.repository.getMediaIdsToBeRefreshed(changedApiIds);

        const promises = [];
        for (const apiId of mediaIds) {
            promises.push(this.fetchAndRefreshMediaDetails(apiId, true));
        }

        return Promise.allSettled(promises);
    }
}
