import {Column, SQL, Table} from "drizzle-orm";
import {SQLiteColumn} from "drizzle-orm/sqlite-core";
import {JobType, Status} from "@/lib/utils/enums";
import {FilterDefinitions} from "@/lib/types/base.types";
import {AchievementSeedData} from "@/lib/types/achievements.types";


type MediaTableColumns = {
    id: Column<any, any, any>;
    name: Column<any, any, any>;
    apiId: Column<any, any, any>;
    synopsis: Column<any, any, any>;
    imageCover: Column<any, any, any>;
    releaseDate: Column<any, any, any>;
    lastApiUpdate: Column<any, any, any>;
}


type ListTableColumns = {
    id: Column<any, any, any>;
    userId: Column<any, any, any>;
    mediaId: Column<any, any, any>;
    status: Column<any, any, any>;
    favorite: Column<any, any, any>;
    comment: Column<any, any, any>;
    rating: Column<any, any, any>;
    redo?: Column<any, any, any>;
}


type LabelTableColumns = {
    id: Column<any, any, any>;
    userId: Column<any, any, any>;
    mediaId: Column<any, any, any>;
    name: Column<any, any, any>;
}


type GenreTableColumns = {
    id: Column<any, any, any>;
    name: Column<any, any, any>;
    mediaId: Column<any, any, any>;
}


type JobDefinition = {
    sourceTable: Table,
    nameColumn: Column<any, any, any>,
    mediaIdColumn: Column<any, any, any>,
    getFilter?: (name: string) => SQL | undefined;
    postProcess?: (results: { name: string | null }[]) => { name: string | null }[];
}


type BaseSelection<TListTable, TMediaTable> = {
    [K in keyof TListTable]: SQLiteColumn | SQL
} | {
    [K in keyof TMediaTable]: SQLiteColumn | SQL
} | {
    mediaName: SQLiteColumn | SQL,
    epsPerSeason?: SQLiteColumn | SQL,
}


export type ListTable = Table & ListTableColumns;
export type MediaTable = Table & MediaTableColumns;
export type LabelTable = Table & LabelTableColumns;
export type GenreTable = Table & GenreTableColumns;


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
        baseSelection: BaseSelection<TListTable, TMediaTable>;
    }
    apiProvider: {
        maxGenres: number;
    }
    achievements: readonly AchievementSeedData[];
    editableFields: Array<keyof TMediaTable["$inferSelect"]>;
    jobDefinitions: Partial<Record<JobType, JobDefinition>>;
    tablesForDeletion: (Table & { mediaId: Column<any, any, any>, name: Column<any, any, any> })[];
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
