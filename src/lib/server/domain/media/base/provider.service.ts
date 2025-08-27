import {BaseRepository} from "@/lib/server/domain/media/base/base.repository";
import {GBooksDetails, IgdbGameDetails, JikanDetails, TmdbMovieDetails, TmdbTvDetails, TrendsMedia} from "@/lib/server/types/provider.types";


export abstract class BaseProviderService<R extends BaseRepository<any>> {
    protected constructor(protected repository: R) {
    }

    protected abstract _transformDetails(rawData: any): Promise<any>;

    protected abstract _fetchRawDetails(apiId: number | string): Promise<IgdbGameDetails | TmdbMovieDetails | TmdbTvDetails | GBooksDetails | JikanDetails>;

    protected abstract _getMediaIdsForBulkRefresh(): Promise<(number | string)[]>;

    async bulkProcessAndRefreshMedia() {
        const mediaIds = await this._getMediaIdsForBulkRefresh();
        const promises = mediaIds.map(apiId => this.fetchAndRefreshMediaDetails(apiId, true));
        return Promise.allSettled(promises);
    }

    async fetchAndStoreMediaDetails(apiId: number | string, isBulk: boolean = false) {
        const details = await this._fetchAndTransformDetails(apiId, isBulk);
        return this.repository.storeMediaWithDetails(details);
    }

    async fetchAndRefreshMediaDetails(apiId: number | string, isBulk: boolean = false) {
        try {
            const details = await this._fetchAndTransformDetails(apiId, isBulk);
            return this.repository.updateMediaWithDetails(details);
        }
        catch (error: any) {
            error.message = `Error refreshing media with apiId ${apiId}: ${error.message}`;
            throw error;
        }
    }

    protected async _enhanceDetails(details: any, _isBulk: boolean, _rawData: any) {
        return details;
    }

    private async _fetchAndTransformDetails(apiId: number | string, isBulk: boolean) {
        const rawData = await this._fetchRawDetails(apiId);
        const details = await this._transformDetails(rawData);
        return this._enhanceDetails(details, isBulk, rawData);
    }
}


export abstract class BaseTrendsProviderService<R extends BaseRepository<any>> extends BaseProviderService<R> {
    protected abstract _fetchRawTrends(): Promise<any>;

    protected abstract _transformTrends(rawData: any): Promise<TrendsMedia[]>;

    async fetchAndFormatTrends() {
        const rawData = await this._fetchRawTrends();
        return this._transformTrends(rawData);
    }
}
