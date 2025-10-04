import {TvRepository} from "@/lib/server/domain/media/tv/tv.repository";
import {TmdbClient} from "@/lib/server/api-providers/clients/tmdb.client";
import {UpsertTvWithDetails} from "@/lib/server/domain/media/tv/tv.types";
import {JikanClient} from "@/lib/server/api-providers/clients/jikan.client";
import {TmdbTrendingTvResponse, TmdbTvDetails} from "@/lib/types/provider.types";
import {TmdbTransformer} from "@/lib/server/api-providers/transformers/tmdb.transformer";
import {BaseTrendsProviderService} from "@/lib/server/domain/media/base/provider.service";


export class TvProviderService extends BaseTrendsProviderService<
    TvRepository,
    TmdbTvDetails,
    UpsertTvWithDetails
> {
    constructor(
        private client: TmdbClient,
        private transformer: TmdbTransformer,
        repository: TvRepository,
        private readonly jikanClient: JikanClient,
    ) {
        super(repository);
    }

    protected _fetchRawDetails(apiId: number) {
        return this.client.getTvDetails(apiId);
    }

    protected _transformDetails(rawData: TmdbTvDetails) {
        const isAnime = rawData.genres?.some((g: { id: number; }) => g.id === 16) && rawData.original_language === "ja";
        if (isAnime) return this.transformer.transformAnimeDetailsResults(rawData);
        return this.transformer.transformSeriesDetailsResults(rawData);
    }

    protected async _getMediaIdsForBulkRefresh() {
        return this.client.getTvChangedIds().then((apiIds) => this.repository.getMediaIdsToBeRefreshed(apiIds));
    }

    protected _fetchRawTrends() {
        return this.client.getTvTrending();
    }

    protected _transformTrends(rawData: TmdbTrendingTvResponse) {
        const tvTrends = this.transformer.transformTvTrends(rawData);
        return tvTrends;
    }

    protected async _enhanceDetails(details: UpsertTvWithDetails, isBulk: boolean, rawData: TmdbTvDetails) {
        const isAnime = rawData.genres?.some((g: { id: number; }) => g.id === 16) && rawData.original_language === "ja";

        if (isAnime && !isBulk) {
            const jikanData = await this.jikanClient.getAnimeGenresAndDemographics(details.mediaData.name);
            details.genresData = this.transformer.addAnimeSpecificGenres(jikanData, details.genresData);
        }

        return details;
    }
}
