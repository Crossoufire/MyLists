import {ApiProviderType, MediaType} from "@/lib/server/utils/enums";


export interface IProviderService {
    bulkProcessAndRefreshMedia(): Promise<PromiseSettledResult<boolean>[]>;
    fetchAndRefreshMediaDetails(apiId: number | string, isBulk?: boolean): Promise<boolean>;
    fetchAndStoreMediaDetails(apiId: number | string, isBulk?: boolean): Promise<number>;
}


export interface ITrendsProviderService extends IProviderService {
    fetchAndFormatTrends(): Promise<TrendsMedia[]>;
}


export type SearchData = {
    page: number;
    rawData: any;
    resultsPerPage: number;
}


export interface ProviderSearchResults {
    hasNextPage: boolean,
    data: ProviderSearchResult[],

}


export type ProviderSearchResult = {
    name: string
    image: string
    id: number | string
    date: string | null
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
