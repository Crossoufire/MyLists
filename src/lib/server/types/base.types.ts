import {SQL} from "drizzle-orm";
import {authOptions} from "@/lib/react-query/query-options/query-options";
import {MediaListArgs} from "@/lib/server/types/media-lists.types";
import {ApiProviderType, MediaType} from "@/lib/server/utils/enums";


interface FilterDefinition {
    isActive: (args: MediaListArgs) => boolean;
    applyJoin?: (qb: any, args: MediaListArgs) => any;
    getCondition: (args: MediaListArgs) => SQL | undefined;
}


export type FilterDefinitions = Record<string, FilterDefinition>;


export type CurrentUser = ReturnType<typeof authOptions>["queryFn"];


export interface ProviderSearchResults {
    id: number | string
    date: string | undefined | null
    name: string | undefined | null
    image: string | undefined | null
    itemType: MediaType | ApiProviderType
}