import * as schema from "@/lib/server/database/schema";
import {JobType, Status} from "@/lib/utils/enums";
import {asc, desc, getTableColumns} from "drizzle-orm";
import {MediaSchemaConfig} from "@/lib/types/media.config.types";
import {createArrayFilterDef} from "@/lib/server/domain/media/base/base.repository";
import {booksAchievements} from "@/lib/server/domain/media/books/achievements.seed";


export type MangaSchemaConfig = MediaSchemaConfig<
    typeof schema.books,
    typeof schema.booksList,
    typeof schema.booksGenre,
    typeof schema.booksLabels
>;


export const booksConfig: MangaSchemaConfig = {
    mediaTable: schema.books,
    listTable: schema.booksList,
    genreTable: schema.booksGenre,
    labelTable: schema.booksLabels,
    mediaList: {
        baseSelection: {
            pages: schema.books.pages,
            mediaName: schema.books.name,
            imageCover: schema.books.imageCover,
            ...getTableColumns(schema.booksList),
        },
        filterDefinitions: {
            langs: createArrayFilterDef({
                argName: "langs",
                mediaTable: schema.books,
                filterColumn: schema.books.language,
            }),
            authors: createArrayFilterDef({
                argName: "authors",
                mediaTable: schema.books,
                entityTable: schema.booksAuthors,
                filterColumn: schema.booksAuthors.name,
            }),
        },
        defaultStatus: Status.READING,
        defaultSortName: "Title A-Z",
        availableSorts: {
            "Title A-Z": asc(schema.books.name),
            "Title Z-A": desc(schema.books.name),
            "Rating +": [desc(schema.booksList.rating), asc(schema.books.name)],
            "Rating -": [asc(schema.booksList.rating), asc(schema.books.name)],
            "Published Date +": [desc(schema.books.releaseDate), asc(schema.books.name)],
            "Published Date -": [asc(schema.books.releaseDate), asc(schema.books.name)],
            "Re-Read": [desc(schema.booksList.redo), asc(schema.books.name)],
            "Pages +": [desc(schema.books.pages), asc(schema.books.name)],
            "Pages -": [asc(schema.books.pages), asc(schema.books.name)],
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
    achievements: booksAchievements,
};
