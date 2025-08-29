import {tvData} from "@/lib/stats/tv";
import {booksData} from "@/lib/stats/books";
import {gamesData} from "@/lib/stats/games";
import {mangaData} from "@/lib/stats/manga";
import {globalData} from "@/lib/stats/global";
import {moviesData} from "@/lib/stats/movies";
import {StatSection} from "@/lib/types/stats.types";
import {MediaType} from "@/lib/server/utils/enums";
import {TvAdvancedStats} from "@/lib/server/domain/media/tv/tv.types";
import {BooksAdvancedStats} from "@/lib/server/domain/media/books/books.types";
import {GamesAdvancedStats} from "@/lib/server/domain/media/games/games.types";
import {MangaAdvancedStats} from "@/lib/server/domain/media/manga/manga.types";
import {MoviesAdvancedStats} from "@/lib/server/domain/media/movies/movies.types";
import {platformStatsOptions, userStatsOptions} from "@/lib/react-query/query-options/query-options";


interface MediaSpecificStatsMap {
    [MediaType.SERIES]: TvAdvancedStats;
    [MediaType.ANIME]: TvAdvancedStats;
    [MediaType.MOVIES]: MoviesAdvancedStats;
    [MediaType.GAMES]: GamesAdvancedStats;
    [MediaType.BOOKS]: BooksAdvancedStats;
    [MediaType.MANGA]: MangaAdvancedStats;
}


export type ApiData =
    Awaited<ReturnType<NonNullable<ReturnType<typeof userStatsOptions>["queryFn"]>>> |
    Awaited<ReturnType<NonNullable<ReturnType<typeof platformStatsOptions>["queryFn"]>>>;

type MediaStatsContainer = Extract<ApiData, { specificMediaStats: object }>;
type MediaStatsBase = Omit<MediaStatsContainer, "specificMediaStats">;
export type SpecificMediaData<T extends MediaType> = MediaStatsBase & {
    mediaType: T,
    specificMediaStats: MediaSpecificStatsMap[T],
};


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
            return tvData(apiData as any);
        case MediaType.MOVIES:
            return moviesData(apiData as any);
        case MediaType.GAMES:
            return gamesData(apiData as any);
        case MediaType.BOOKS:
            return booksData(apiData as any);
        case MediaType.MANGA:
            return mangaData(apiData as any);
        default:
            return [];
    }
};
