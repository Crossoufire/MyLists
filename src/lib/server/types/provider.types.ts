import {ApiProviderType, MediaType} from "@/lib/server/utils/enums";


export interface IProviderService {
    bulkProcessAndRefreshMedia(): Promise<PromiseSettledResult<boolean>[]>;
    fetchAndRefreshMediaDetails(apiId: number, isBulk?: boolean): Promise<boolean>;
    fetchAndStoreMediaDetails(apiId: number, isBulk?: boolean): Promise<number | undefined>;
}


export interface ITrendsProviderService extends IProviderService {
    fetchAndFormatTrends(): Promise<TrendsMedia[]>;
}


export interface ProviderSearchResults {
    id: number | string
    date: string | undefined | null
    name: string | undefined | null
    image: string | undefined | null
    itemType: MediaType | ApiProviderType
}


export type TrendsMedia = {
    apiId: number,
    overview: string,
    posterPath: string,
    displayName: string,
    releaseDate: string,
    mediaType: MediaType,
}
