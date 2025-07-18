import {Column, SQL, Table} from "drizzle-orm";
import {JobType, Status} from "@/lib/server/utils/enums";
import {SQLiteColumn} from "drizzle-orm/sqlite-core";
import {FilterDefinitions} from "@/lib/server/types/base.types";


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
    redo?: Column<any, any, any>;
}


interface LabelTableColumns {
    id: Column<any, any, any>;
    userId: Column<any, any, any>;
    mediaId: Column<any, any, any>;
    name: Column<any, any, any>;
}


interface GenreTableColumns {
    id: Column<any, any, any>;
    name: Column<any, any, any>;
    mediaId: Column<any, any, any>;
}


interface JobDefinition {
    joinTable?: TableWithMediaId;
    getFilter: (name: string) => SQL | undefined;
};


export type ListTable = Table & ListTableColumns;
export type MediaTable = Table & MediaTableColumns;
export type LabelTable = Table & LabelTableColumns;
export type GenreTable = Table & GenreTableColumns;
export type TableWithMediaId = Table & { mediaId: Column<any, any, any> };

type BaseSelection<TListTable, TMediaTable> = {
    [K in keyof TListTable]: SQLiteColumn | SQL
} | {
    [K in keyof TMediaTable]: SQLiteColumn | SQL
} | {
    mediaName: SQLiteColumn | SQL
}


export interface MediaSchemaConfig<
    TMediaTable extends MediaTable,
    TListTable extends ListTable,
    TGenreTable extends GenreTable,
    TLabelTable extends LabelTable
> {
    mediaTable: TMediaTable;
    listTable: TListTable;
    genreTable: TGenreTable;
    labelTable: TLabelTable;
    mediaList: {
        defaultStatus: Status;
        defaultSortName: string;
        filterDefinitions: FilterDefinitions;
        availableSorts: Record<string, SQL | SQL[]>;
        baseSelection: BaseSelection<TListTable, TMediaTable> & { epsPerSeason?: SQL };
    }
    apiProvider: {
        maxGenres: number;
    }
    editableFields: Array<keyof TMediaTable["$inferSelect"]>;
    jobDefinitions: Partial<Record<JobType, JobDefinition>>;
    tablesForDeletion: TableWithMediaId[];
}


export interface TvSchemaConfig<
    TMediaTable extends MediaTable,
    TListTable extends ListTable,
    TGenreTable extends GenreTable,
    TLabelTable extends LabelTable,
    TActorTable extends Table,
    TNetworkTable extends Table,
    TEpsPerSeasonTable extends Table,
> extends MediaSchemaConfig<TMediaTable, TListTable, TGenreTable, TLabelTable> {
    actorTable: TActorTable;
    networkTable: TNetworkTable;
    epsPerSeasonTable: TEpsPerSeasonTable;
}
