import {Column, SQL, Table} from "drizzle-orm";
import {GamesPlatformsEnum, Status} from "@/lib/server/utils/enums";
import {FilterDefinitions} from "./provider.types";


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


interface MediaTableColumns {
    id: Column<any, any, any>;
    name: Column<any, any, any>;
    apiId: Column<any, any, any>;
    synopsis: Column<any, any, any>;
    imageCover: Column<any, any, any>;
    releaseDate: Column<any, any, any>;
    lastApiUpdate: Column<any, any, any>;
}


interface ListTableColumns {
    id: Column<any, any, any>;
    userId: Column<any, any, any>;
    mediaId: Column<any, any, any>;
    status: Column<any, any, any>;
    favorite: Column<any, any, any>;
    comment: Column<any, any, any>;
    rating: Column<any, any, any>;
}


interface LabelTableColumns {
    id: Column<any, any, any>;
    userId: Column<any, any, any>;
    mediaId: Column<any, any, any>;
    name: Column<any, any, any>;
}


interface GenreTableColumns {
    id: Column<any, any, any>;
    mediaId: Column<any, any, any>;
    name: Column<any, any, any>;
}


export type ListTable = Table & ListTableColumns;
export type MediaTable = Table & MediaTableColumns;
export type LabelTable = Table & LabelTableColumns;
export type GenreTable = Table & GenreTableColumns;


export interface MediaSchemaConfig<
    TMediaTable extends MediaTable,
    TListTable extends ListTable,
    TGenreTable extends GenreTable,
    TLabelTable extends LabelTable,
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
    tablesForDeletion: any[];
}


export type TActorTableParam = Table;
export type TNetworkTableParam = Table;
export type TEpsPerSeasonTableParam = Table;


export interface TVSchemaConfig<
    TMediaTable extends MediaTable,
    TListTable extends ListTable,
    TGenreTable extends GenreTable,
    TLabelTable extends LabelTable,
    TActorTableParam extends Table,
    TNetworkTableParam extends Table,
    TEpsPerSeasonTableParam extends Table,
> extends MediaSchemaConfig<TMediaTable, TListTable, TGenreTable, TLabelTable> {
    actorTable: TActorTableParam;
    networkTable: TNetworkTableParam;
    epsPerSeasonTable: TEpsPerSeasonTableParam;
}