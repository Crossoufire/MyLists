import {Column, SQL, Table} from "drizzle-orm";
import * as schema from "@/lib/server/database/schema";
import {GamesPlatformsEnum, Status} from "@/lib/server/utils/enums";


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


interface RelatedEntityConfig<TJoinTable extends Table, TEntityTable extends Table> {
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
    baseSelection: SelectionMap<TListTable, TMediaTable>;
    availableSorts: Record<string, SQL | SQL[]>;
    defaultSortName: string;
    genreConfig?: RelatedEntityConfig<any, any>;
    actorConfig?: RelatedEntityConfig<any, any>;
    companyConfig?: RelatedEntityConfig<any, any>;
    developerConfig?: RelatedEntityConfig<any, any>;
    networkConfig?: RelatedEntityConfig<any, any>;
    creatorConfig?: RelatedEntityConfig<any, any>;
    publisherConfig?: RelatedEntityConfig<any, any>;
    authorConfig?: RelatedEntityConfig<any, any>;
}


export type MovieSchemaConfig = MediaSchemaConfig<
    typeof schema.movies,
    typeof schema.moviesList,
    typeof schema.moviesGenre,
    typeof schema.moviesLabels
> & {
    genreConfig: RelatedEntityConfig<typeof schema.movies, typeof schema.moviesGenre>;
    actorConfig: RelatedEntityConfig<typeof schema.movies, typeof schema.moviesActors>;
};
