import {ProviderSearchResults} from "@/lib/server/media-providers/interfaces/types";


export interface ISearchProvider {
    search(query: string, page: number): Promise<ProviderSearchResults[]>;
}
