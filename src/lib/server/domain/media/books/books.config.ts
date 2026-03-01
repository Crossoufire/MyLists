import {asc, desc, getTableColumns} from "drizzle-orm";
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
            pages: books.pages,
            mediaName: books.name,
            imageCover: books.imageCover,
            ...getTableColumns(booksList),
        },
        filterDefinitions: {
            langs: createArrayFilterDef({
                argName: "langs",
                mediaTable: books,
                filterColumn: books.language,
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
            "Published Date -": [asc(books.releaseDate), asc(books.name)],
            "Recently Added": [desc(booksList.addedAt), asc(books.name)],
            "Re-Read": [desc(booksList.redo), asc(books.name)],
            "Pages +": [desc(books.pages), asc(books.name)],
            "Pages -": [asc(books.pages), asc(books.name)],
        },
    },
    apiProvider: {
        maxGenres: 5,
        name: "GoogleBooks",
        mediaUrl: "https://books.google.com/books?id=",
    },
    editableFields: ["name", "releaseDate", "pages", "language", "publishers", "synopsis", "lockStatus"],
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
