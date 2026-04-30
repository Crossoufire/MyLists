import {asc, desc, getTableColumns, sql} from "drizzle-orm";
import {JobType, MediaType, Status} from "@/lib/utils/enums";
import {MediaSchemaConfig} from "@/lib/types/media.config.types";
import {createArrayFilterDef} from "@/lib/server/domain/media/base/base.repository";
import {booksAchievements} from "@/lib/server/domain/media/books/achievements.seed";
import {books, booksAuthors, booksGenre, booksList, booksTags} from "@/lib/server/database/schema/media/books.schema";


export type MangaSchemaConfig = MediaSchemaConfig<
    typeof books,
    typeof booksList,
    typeof booksGenre,
    typeof booksTags
>;


export const booksConfig: MangaSchemaConfig = {
    mediaTable: books,
    listTable: booksList,
    genreTable: booksGenre,
    tagTable: booksTags,
    mediaType: MediaType.BOOKS,
    mediaList: {
        baseSelection: {
            mediaName: books.name,
            imageCover: books.imageCover,
            ...getTableColumns(booksList),
        },
        filterDefinitions: {
            langs: createArrayFilterDef({
                argName: "langs",
                mediaTable: books,
                filterColumn: booksList.language,
            }),
            publishers: createArrayFilterDef({
                argName: "publishers",
                mediaTable: books,
                filterColumn: booksList.publisher,
            }),
            authors: createArrayFilterDef({
                argName: "authors",
                mediaTable: books,
                entityTable: booksAuthors,
                filterColumn: booksAuthors.name,
            }),
        },
        defaultStatus: Status.PLAN_TO_READ,
        defaultSortName: "Title A-Z",
        availableSorts: {
            "Title A-Z": asc(books.name),
            "Title Z-A": desc(books.name),
            "Rating +": [desc(booksList.rating), asc(books.name)],
            "Rating -": [asc(booksList.rating), asc(books.name)],
            "Published Date +": [desc(books.releaseDate), asc(books.name)],
            "Published Date -": [sql`${books.releaseDate} ASC NULLS LAST`, asc(books.name)],
            "Recently Added": [desc(booksList.addedAt), asc(books.name)],
            "Re-Read": [desc(booksList.redo), asc(books.name)],
            "Pages +": [desc(booksList.pageCount), asc(books.name)],
            "Pages -": [asc(booksList.pageCount), asc(books.name)],
        },
    },
    apiProvider: {
        maxGenres: 5,
        name: "GoogleBooks",
        mediaUrl: "https://books.google.com/books?id=",
    },
    editableFields: ["name", "releaseDate", "synopsis", "lockStatus"],
    jobDefinitions: {
        [JobType.CREATOR]: {
            sourceTable: booksAuthors,
            nameColumn: booksAuthors.name,
            mediaIdColumn: booksAuthors.mediaId,
        },
    },
    tablesForDeletion: [booksAuthors, booksGenre, booksTags],
    achievements: booksAchievements,
};
