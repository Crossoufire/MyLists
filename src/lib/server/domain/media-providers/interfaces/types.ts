import {ApiProviderType, MediaType} from "@/lib/server/utils/enums";


export interface ProviderSearchResults {
    id: number | string
    date: string | undefined | null
    name: string | undefined | null
    image: string | undefined | null
    itemType: MediaType | ApiProviderType
}
