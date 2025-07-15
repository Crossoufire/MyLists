import {TrendsMedia} from "@/lib/server/types/provider.types";


export abstract class ProviderService {
    abstract bulkProcessAndRefreshMedia(): Promise<PromiseSettledResult<boolean>[]>;

    abstract fetchAndRefreshMediaDetails(apiId: number | string, isBulk?: boolean): Promise<boolean>;

    abstract fetchAndStoreMediaDetails(apiId: number | string, isBulk?: boolean): Promise<number>;
}


export abstract class TrendsProviderService extends ProviderService {
    abstract fetchAndFormatTrends(): Promise<TrendsMedia[]>;
}
