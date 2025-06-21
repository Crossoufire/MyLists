import {SQL} from "drizzle-orm";
import {MediaListArgs} from "@/lib/server/types/media-lists.types";
import {ApiProviderType, MediaType} from "@/lib/server/utils/enums";
import {authOptions} from "@/lib/react-query/query-options/query-options";


export interface ListFilterDefinition {
    argName: keyof MediaListArgs;
    entityTable: any;
    filterColumn: any;
    mediaTable: any;
}


export interface FilterDefinition {
    isActive: (args: MediaListArgs) => boolean;
    getCondition: (args: MediaListArgs) => SQL | undefined;
}


export type FilterDefinitions = Partial<Record<keyof MediaListArgs, FilterDefinition>>;


export type CurrentUser = ReturnType<typeof authOptions>["queryFn"];


export interface ProviderSearchResults {
    id: number | string
    date: string | undefined | null
    name: string | undefined | null
    image: string | undefined | null
    itemType: MediaType | ApiProviderType
}