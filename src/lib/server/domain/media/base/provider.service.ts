import {TrendsMedia} from "@/lib/types/provider.types";
import {BaseRepository} from "@/lib/server/domain/media/base/base.repository";


export abstract class BaseProviderService<R extends BaseRepository<any>, TRawDetails, TTransformedDetails> {
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
        const chunkSize = this._getBulkRefreshChunkSize();
        const canBulkFetch = !!this._fetchRawDetailsBatch && chunkSize > 1;

        if (!canBulkFetch) {
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
            return;
        }

        for (let i = 0; i < mediaIds.length; i += chunkSize) {
            if (limit !== undefined && yieldedCount >= limit) {
                return;
            }

            const remaining = limit === undefined ? undefined : limit - yieldedCount;
            const sliceSize = remaining === undefined ? chunkSize : Math.min(chunkSize, remaining);
            const chunk = mediaIds.slice(i, i + sliceSize);

            try {
                const rawDetails = await this._fetchRawDetailsBatch!(chunk);

                const rawDetailsById = new Map<number | string, TRawDetails>();
                for (const rawDetail of rawDetails) {
                    const apiId = this._getApiIdFromRawDetails(rawDetail);
                    if (apiId !== undefined && apiId !== null) {
                        rawDetailsById.set(apiId, rawDetail);
                    }
                }

                for (const apiId of chunk) {
                    const rawDetail = rawDetailsById.get(apiId);
                    if (!rawDetail) {
                        yield { apiId, state: "rejected", reason: new Error("Missing bulk details response") };
                        yieldedCount += 1;
                        if (limit !== undefined && yieldedCount >= limit) {
                            return;
                        }
                        continue;
                    }

                    try {
                        await this._refreshFromRawDetails(rawDetail, true);
                        yield { apiId, state: "fulfilled", reason: undefined };
                    }
                    catch (reason) {
                        yield { apiId, state: "rejected", reason: reason as Error };
                    }

                    yieldedCount += 1;
                    if (limit !== undefined && yieldedCount >= limit) {
                        return;
                    }
                }
            }
            catch (reason) {
                for (const apiId of chunk) {
                    yield { apiId, state: "rejected", reason: reason as Error };
                    yieldedCount += 1;
                    if (limit !== undefined && yieldedCount >= limit) {
                        return;
                    }
                }
            }
        }
    }

    async fetchAndStoreMediaDetails(apiId: number | string, isBulk: boolean = false) {
        const details = await this._fetchAndTransformDetails(apiId, isBulk);
        return this.repository.storeMediaWithDetails(details);
    }

    async fetchAndRefreshMediaDetails(apiId: number | string, isBulk: boolean = false) {
        const rawData = await this._fetchRawDetails(apiId);
        await this._refreshFromRawDetails(rawData, isBulk);
    }

    private async _fetchAndTransformDetails(apiId: number | string, isBulk: boolean) {
        const rawData = await this._fetchRawDetails(apiId);
        const details = await this._transformDetails(rawData);
        return this._enhanceDetails(details, isBulk, rawData);
    }

    protected async _refreshFromRawDetails(rawData: TRawDetails, isBulk: boolean) {
        const details = await this._transformDetails(rawData);
        const enhancedDetails = await this._enhanceDetails(details, isBulk, rawData);
        await this.repository.updateMediaWithDetails(enhancedDetails);
    }

    protected _getBulkRefreshChunkSize() {
        return 1;
    }

    protected async _enhanceDetails(details: TTransformedDetails, _isBulk: boolean, _rawData: TRawDetails) {
        return details;
    }

    protected _getApiIdFromRawDetails(rawData: TRawDetails) {
        // Does not work for Jikan which return `mal_id` and not `id`.
        // Would need to override this method if we ever do chunk refresh. For now only IGDB uses this.
        return (rawData as { id?: number | string })?.id;
    }

    protected _fetchRawDetailsBatch?(apiIds: (number | string)[]): Promise<TRawDetails[]>;

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
