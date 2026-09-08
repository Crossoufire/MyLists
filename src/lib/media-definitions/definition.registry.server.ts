import {MediaType} from "@/lib/utils/enums";
import {booksServerDefinition} from "@/lib/media-definitions/books/book.definition.server";
import {gamesServerDefinition} from "@/lib/media-definitions/games/games.definition.server";
import {mangaServerDefinition} from "@/lib/media-definitions/manga/manga.definition.server";
import {animeServerDefinition} from "@/lib/media-definitions/tv/anime/anime.definition.server";
import {moviesServerDefinition} from "@/lib/media-definitions/movies/movies.definition.server";
import {seriesServerDefinition} from "@/lib/media-definitions/tv/series/series.definition.server";
import type {AnyServerMediaDefinition} from "@/lib/media-definitions/base/media.definition.server";


const serverMediaDefinitions = {
    [MediaType.SERIES]: seriesServerDefinition,
    [MediaType.ANIME]: animeServerDefinition,
    [MediaType.MOVIES]: moviesServerDefinition,
    [MediaType.GAMES]: gamesServerDefinition,
    [MediaType.BOOKS]: booksServerDefinition,
    [MediaType.MANGA]: mangaServerDefinition,
} as const satisfies Record<MediaType, AnyServerMediaDefinition>;


export const getServerMediaDefinition = (mediaType: MediaType): AnyServerMediaDefinition => {
    return serverMediaDefinitions[mediaType];
};
