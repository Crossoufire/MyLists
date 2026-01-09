import {TrendsMedia} from "@/lib/types/provider.types";
import {BaseRepository} from "@/lib/server/domain/media/base/base.repository";


export abstract class BaseProviderService<
    R extends BaseRepository<any>,
    TRawDetails,
    TTransformedDetails,
> {
    protected constructor(protected repository: R) {
    }

    async* bulkProcessAndRefreshMedia(limit?: number) {
        let mediaIds: (number | string)[] = [];

        try {
            mediaIds = await this._getMediaIdsForBulkRefresh();
        }
        catch (err) {
            yield { apiId: undefined, state: "rejected", reason: err };
            return;
        }

        let yieldedCount = 0;
        for (const apiId of mediaIds) {
            if (limit !== undefined && yieldedCount >= limit) {
                return;
            }

            try {
                await this.fetchAndRefreshMediaDetails(apiId, true);
                yield { apiId, state: "fulfilled", reason: undefined };
            }
            catch (reason) {
                yield { apiId, state: "rejected", reason: reason as Error };
            }

            yieldedCount += 1;
        }
    }

    async fetchAndStoreMediaDetails(apiId: number | string, isBulk: boolean = false) {
        const details = await this._fetchAndTransformDetails(apiId, isBulk);
        return this.repository.storeMediaWithDetails(details);
    }

    async fetchAndRefreshMediaDetails(apiId: number | string, isBulk: boolean = false) {
        const details = await this._fetchAndTransformDetails(apiId, isBulk);
        await this.repository.updateMediaWithDetails(details);
    }

    protected async _enhanceDetails(details: TTransformedDetails, _isBulk: boolean, _rawData: TRawDetails) {
        return details;
    }

    private async _fetchAndTransformDetails(apiId: number | string, isBulk: boolean) {
        const rawData = await this._fetchRawDetails(apiId);
        const details = await this._transformDetails(rawData);
        return this._enhanceDetails(details, isBulk, rawData);
    }

    protected abstract _transformDetails(rawData: TRawDetails): Promise<TTransformedDetails>;

    protected abstract _fetchRawDetails(apiId: number | string): Promise<TRawDetails>;

    protected abstract _getMediaIdsForBulkRefresh(): Promise<(number | string)[]>;
}


export abstract class BaseTrendsProviderService<
    R extends BaseRepository<any>,
    TRawDetails,
    TTransformedDetails,
> extends BaseProviderService<R, TRawDetails, TTransformedDetails> {
    async fetchAndFormatTrends() {
        const rawData = await this._fetchRawTrends();
        return this._transformTrends(rawData);
    }

    protected abstract _fetchRawTrends(): Promise<any>;

    protected abstract _transformTrends(rawData: any): Promise<TrendsMedia[]>;
}
