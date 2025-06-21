import {Column, SQL, Table} from "drizzle-orm";
import {ApiProviderType, MediaType} from "@/lib/server/utils/enums";
import {authOptions} from "@/lib/react-query/query-options/query-options";
import {MediaListArgs, MediaTable} from "@/lib/server/types/media-lists.types";


export interface ListFilterDefinition {
    mediaTable: MediaTable;
    argName: keyof MediaListArgs;
    filterColumn: Column<any, any, any>;
    entityTable: Table & { mediaId: Column<any, any, any> };
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