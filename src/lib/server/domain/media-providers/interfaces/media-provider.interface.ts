import {ProviderSearchResults} from "@/lib/server/domain/media-providers/interfaces/types";


export interface ISearchProvider {
    search(query: string, page: number): Promise<ProviderSearchResults[]>;
}
