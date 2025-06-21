import {Column, SQL, Table} from "drizzle-orm";
import {GamesPlatformsEnum, Status} from "@/lib/server/utils/enums";
import {FilterDefinitions} from "./base.types";


export interface MediaListArgs {
    page?: number;
    perPage?: number;
    search?: string;
    sort?: string,
    status?: Status[];
    genres?: string[];
    labels?: string[];
    langs?: string[];
    favorite?: boolean;
    comment?: boolean;
    hideCommon?: boolean;
    sorting?: string;
    directors?: string[];
    platforms?: GamesPlatformsEnum[];
    publishers?: string[];
    actors?: string[];
    authors?: string[];
    companies?: string[];
    networks?: string[];
    creators?: string[];
    currentUserId?: number;
    userId?: number;
}


type SelectionMap<TListTable extends Table, TMediaTable extends Table> = {
    [key: string]: Column<any, object, any> | SQL | SQL.Aliased;
    // @ts-ignore
    userId: TListTable["userId"];
    // @ts-ignore
    mediaId: TListTable["mediaId"];
    // @ts-ignore
    mediaName: TMediaTable["name"];
};


export interface RelatedEntityConfig<TJoinTable extends Table, TEntityTable extends Table> {
    entityTable: TEntityTable;
    idColumnInMedia: TJoinTable[keyof TJoinTable];
    filterColumnInEntity: TEntityTable[keyof TEntityTable];
    mediaIdColumnInEntity: TEntityTable[keyof TEntityTable];
}


export interface MediaSchemaConfig<
    TMediaTable extends Table,
    TListTable extends Table,
    TGenreTable extends Table,
    TLabelTable extends Table,
> {
    mediaTable: TMediaTable;
    genreTable: TGenreTable;
    listTable: TListTable;
    labelTable: TLabelTable;
    mediaList: {
        baseSelection: SelectionMap<TListTable, TMediaTable>;
        defaultStatus: Status;
        defaultSortName: string;
        filterDefinitions: FilterDefinitions;
        availableSorts: Record<string, SQL | SQL[]>;
    }
    apiProvider: {
        maxGenres: number;
    }
    editableFields: string[];
}


export type TActorTableParam = Table;
export type TNetworkTableParam = Table;
export type TEpsPerSeasonTableParam = Table;


export interface TVSchemaConfig<
    TMediaTable extends Table,
    TListTable extends Table,
    TGenreTable extends Table,
    TLabelTable extends Table,
    TActorTableParam extends Table,
    TNetworkTableParam extends Table,
    TEpsPerSeasonTableParam extends Table,
> extends MediaSchemaConfig<TMediaTable, TListTable, TGenreTable, TLabelTable> {
    actorTable: TActorTableParam;
    networkTable: TNetworkTableParam;
    epsPerSeasonTable: TEpsPerSeasonTableParam;
}