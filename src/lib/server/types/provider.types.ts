import {ApiProviderType, MediaType} from "@/lib/server/utils/enums";


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


export type IgdbTokenResponse = {
    access_token?: string,
    expires_in: number,
    token_type: string,
}
