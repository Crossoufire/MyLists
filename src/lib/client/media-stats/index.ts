import {MediaType} from "@/lib/utils/enums";
import {tvData} from "@/lib/client/media-stats/tv";
import {StatSection} from "@/lib/types/stats.types";
import {booksData} from "@/lib/client/media-stats/books";
import {gamesData} from "@/lib/client/media-stats/games";
import {mangaData} from "@/lib/client/media-stats/manga";
import {globalData} from "@/lib/client/media-stats/global";
import {moviesData} from "@/lib/client/media-stats/movies";
import {TvAdvancedStats} from "@/lib/server/domain/media/tv/tv.types";
import {PlatformStats, UserStats} from "@/lib/types/query.options.types";
import {BooksAdvancedStats} from "@/lib/server/domain/media/books/books.types";
import {GamesAdvancedStats} from "@/lib/server/domain/media/games/games.types";
import {MangaAdvancedStats} from "@/lib/server/domain/media/manga/manga.types";
import {MoviesAdvancedStats} from "@/lib/server/domain/media/movies/movies.types";


interface MediaSpecificStatsMap {
    [MediaType.SERIES]: TvAdvancedStats;
    [MediaType.ANIME]: TvAdvancedStats;
    [MediaType.MOVIES]: MoviesAdvancedStats;
    [MediaType.GAMES]: GamesAdvancedStats;
    [MediaType.BOOKS]: BooksAdvancedStats;
    [MediaType.MANGA]: MangaAdvancedStats;
}


export type ApiData = UserStats | PlatformStats;

type MediaStatsContainer = Extract<ApiData, { specificMediaStats: object }>;
type MediaStatsBase = Omit<MediaStatsContainer, "specificMediaStats">;
export type SpecificMediaData<T extends MediaType> = MediaStatsBase & {
    mediaType: T,
    specificMediaStats: MediaSpecificStatsMap[T],
};


export type GlobalData = Extract<ApiData, { mediaType?: undefined }>;
export type TvData = SpecificMediaData<typeof MediaType.SERIES | typeof MediaType.ANIME>;
export type MoviesData = SpecificMediaData<typeof MediaType.MOVIES>;
export type GamesData = SpecificMediaData<typeof MediaType.GAMES>;
export type BooksData = SpecificMediaData<typeof MediaType.BOOKS>;
export type MangaData = SpecificMediaData<typeof MediaType.MANGA>;


interface DataToLoadProps {
    apiData: ApiData;
    forUser?: boolean;
}


export const dataToLoad = ({ apiData, forUser = false }: DataToLoadProps): StatSection[] => {
    switch (apiData.mediaType) {
        case undefined:
            return globalData(apiData, forUser);
        case MediaType.SERIES:
        case MediaType.ANIME:
            return tvData(apiData as TvData);
        case MediaType.MOVIES:
            return moviesData(apiData as MoviesData);
        case MediaType.GAMES:
            return gamesData(apiData as GamesData);
        case MediaType.BOOKS:
            return booksData(apiData as BooksData);
        case MediaType.MANGA:
            return mangaData(apiData as MangaData);
        default:
            return [];
    }
};
