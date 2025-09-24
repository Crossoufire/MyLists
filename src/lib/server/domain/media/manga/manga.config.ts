import * as schema from "@/lib/server/database/schema";
import {JobType, Status} from "@/lib/utils/enums";
import {asc, desc, getTableColumns} from "drizzle-orm";
import {MediaSchemaConfig} from "@/lib/types/media.config.types";
import {createArrayFilterDef} from "@/lib/server/domain/media/base/base.repository";
import {mangaAchievements} from "@/lib/server/domain/media/manga/achievements.seed";


export type MangaSchemaConfig = MediaSchemaConfig<
    typeof schema.manga,
    typeof schema.mangaList,
    typeof schema.mangaGenre,
    typeof schema.mangaLabels
>;


export const mangaConfig: MangaSchemaConfig = {
    mediaTable: schema.manga,
    listTable: schema.mangaList,
    genreTable: schema.mangaGenre,
    labelTable: schema.mangaLabels,
    mediaList: {
        baseSelection: {
            mediaName: schema.manga.name,
            chapters: schema.manga.chapters,
            imageCover: schema.manga.imageCover,
            ...getTableColumns(schema.mangaList),
        },
        filterDefinitions: {
            authors: createArrayFilterDef({
                argName: "authors",
                mediaTable: schema.manga,
                entityTable: schema.mangaAuthors,
                filterColumn: schema.mangaAuthors.name,
            }),
            publishers: createArrayFilterDef({
                argName: "publishers",
                mediaTable: schema.manga,
                filterColumn: schema.manga.publishers,
            }),
        },
        defaultStatus: Status.READING,
        defaultSortName: "Title A-Z",
        availableSorts: {
            "Title A-Z": asc(schema.manga.name),
            "Title Z-A": desc(schema.manga.name),
            "Rating +": [desc(schema.mangaList.rating), asc(schema.manga.name)],
            "Rating -": [asc(schema.mangaList.rating), asc(schema.manga.name)],
            "Published Date +": [desc(schema.manga.releaseDate), asc(schema.manga.name)],
            "Published Date -": [asc(schema.manga.releaseDate), asc(schema.manga.name)],
            "Re-Read": [desc(schema.mangaList.redo), asc(schema.manga.name)],
            "Chapters +": [desc(schema.manga.chapters), asc(schema.manga.name)],
            "Chapters -": [asc(schema.manga.chapters), asc(schema.manga.name)],
        },
    },
    apiProvider: {
        maxGenres: 5,
    },
    editableFields: ["name", "releaseDate", "chapters", "publishers", "synopsis"],
    jobDefinitions: {
        [JobType.CREATOR]: {
            sourceTable: schema.mangaAuthors,
            nameColumn: schema.mangaAuthors.name,
            mediaIdColumn: schema.mangaAuthors.mediaId,
        },
        [JobType.PUBLISHER]: {
            sourceTable: schema.manga,
            mediaIdColumn: schema.manga.id,
            nameColumn: schema.manga.publishers,
        },
    },
    tablesForDeletion: [schema.mangaAuthors, schema.mangaGenre, schema.mangaLabels],
    achievements: mangaAchievements,
};
