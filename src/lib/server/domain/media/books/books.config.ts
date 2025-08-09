import * as schema from "@/lib/server/database/schema";
import {JobType, Status} from "@/lib/server/utils/enums";
import {asc, desc, getTableColumns, sql} from "drizzle-orm";
import {MediaSchemaConfig} from "@/lib/server/types/media-lists.types";
import {createListFilterDef} from "@/lib/server/domain/media/base/base.repository";


export type BooksSchemaConfig = MediaSchemaConfig<
    typeof schema.books,
    typeof schema.booksList,
    typeof schema.booksGenre,
    typeof schema.booksLabels
>;


export const booksConfig: BooksSchemaConfig = {
    mediaTable: schema.books,
    listTable: schema.booksList,
    genreTable: schema.booksGenre,
    labelTable: schema.booksLabels,
    mediaList: {
        baseSelection: {
            mediaName: schema.books.name,
            imageCover: schema.books.imageCover,
            language: schema.books.language,
            authors: sql<{ name: string }[]>`(
                SELECT json_group_array(json_object('name', ${schema.booksAuthors.name}))
                FROM ${schema.booksAuthors} 
                WHERE ${schema.booksAuthors.mediaId} = ${schema.books.id}
            )`.mapWith(JSON.parse),
            ...getTableColumns(schema.booksList),
        },
        filterDefinitions: {
            authors: createListFilterDef({
                argName: "authors",
                mediaTable: schema.books,
                entityTable: schema.booksAuthors,
                filterColumn: schema.booksAuthors.name,
            }),
        },
        defaultStatus: Status.COMPLETED,
        defaultSortName: "Title A-Z",
        availableSorts: {
            "Title A-Z": asc(schema.books.name),
            "Title Z-A": desc(schema.books.name),
            "Rating +": [desc(schema.booksList.rating), asc(schema.books.name)],
            "Rating -": [asc(schema.booksList.rating), asc(schema.books.name)],
            "Published Date +": [desc(schema.books.releaseDate), asc(schema.books.name)],
            "Published Date -": [asc(schema.books.releaseDate), asc(schema.books.name)],
            "Re-Read": [desc(schema.booksList.redo), asc(schema.books.name)],
        },
    },
    apiProvider: {
        maxGenres: 5,
    },
    editableFields: ["name", "releaseDate", "pages", "language", "publishers", "synopsis"],
    jobDefinitions: {
        [JobType.CREATOR]: {
            sourceTable: schema.booksAuthors,
            nameColumn: schema.booksAuthors.name,
            mediaIdColumn: schema.booksAuthors.mediaId,
        },
    },
    tablesForDeletion: [schema.booksAuthors, schema.booksGenre, schema.booksLabels],
};
