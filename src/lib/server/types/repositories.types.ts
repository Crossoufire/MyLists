import {JobType, Status} from "@/lib/server/utils/enums";
import {TvList, TvTopMetricStats, TvType} from "@/lib/server/domain/media/tv/tv.types";
import {Achievement} from "@/lib/server/types/achievements.types";
import {Label} from "@/lib/components/user-media/LabelsDialog";
import {Game, GamesList, GamesTopMetricStats} from "@/lib/server/domain/media/games/games.types";
import {MediaListArgs} from "@/lib/server/types/media-lists.types";
import {EditUserLabels} from "@/lib/server/domain/media/base/base.repository";
import {GamesSchemaConfig} from "@/lib/server/domain/media/games/games.config";
import {Movie, MoviesList, MoviesTopMetricStats, UpsertMovieWithDetails} from "@/lib/server/domain/media/movies/movies.types";
import {MovieSchemaConfig} from "@/lib/server/domain/media/movies/movies.config";
import {AnimeSchemaConfig} from "@/lib/server/domain/media/tv/anime/anime.config";
import {SeriesSchemaConfig} from "@/lib/server/domain/media/tv/series/series.config";
import {
    AddedMediaDetails,
    ComingNext,
    CommonListFilters,
    ExpandedListFilters,
    ItemForNotification,
    JobDetails,
    TopMetricStats,
    UserMediaStats
} from "@/lib/server/types/base.types";
import {SQL} from "drizzle-orm";


// Level 1 - Universal methods (implemented in BaseRepository)
export interface IUniversalRepository<TMedia, TList> {
    findById(mediaId: number): Promise<TMedia | undefined>;
    findByApiId(apiId: number | string): Promise<TMedia | undefined>;
    downloadMediaListAsCSV(userId: number): Promise<(TMedia & { mediaName: string })[] | undefined>;
    searchByName(query: string, limit?: number): Promise<{ name: string }[]>;
    removeMediaByIds(mediaIds: number[]): Promise<void>;
    getNonListMediaIds(): Promise<number[]>;
    getCoverFilenames(): Promise<{ imageCover: string }[]>;
    findSimilarMedia(mediaId: number,): Promise<{ mediaId: number; mediaName: string; mediaCover: string | null }[]>;
    getUserMediaLabels(userId: number): Promise<{ name: string }[]>;
    editUserLabel(args: EditUserLabels): Promise<Label | void>;
    getUserFavorites(userId: number, limit?: number): Promise<any[]>;
    findUserMedia(userId: number, mediaId: number): Promise<any | null>;
    getUserFollowsMediaData(userId: number, mediaId: number): Promise<any[]>;
    getCommonListFilters(userId: number): Promise<CommonListFilters>;
    getMediaList(currentUserId: number | undefined, userId: number, args: MediaListArgs): Promise<any>;
    computeTotalMediaLabel(userId?: number): Promise<number>;
    removeMediaFromUserList(userId: number, mediaId: number): Promise<void>;

    // --- Achievements ----------------------------------------------------------
    countRatedAchievementCte(achievement: Achievement, userId?: number): Promise<any>;
    specificGenreAchievementCte(achievement: Achievement, userId?: number): Promise<any>;
    countCompletedAchievementCte(achievement: Achievement, userId?: number): Promise<any>;
    countCommentedAchievementCte(achievement: Achievement, userId?: number): Promise<any>;
    applyWhereConditionsAndGrouping(cte: any, baseConditions: SQL[], userId?: number): any;

    // --- Advanced Stats ---------------------------------------------------
    computeRatingStats(userId?: number): Promise<any>;
    computeTopGenresStats(userId?: number): Promise<any>;
    computeReleaseDateStats(userId?: number): Promise<any>;
    computeTotalMediaLabel(userId?: number): Promise<number>;
    computeTopMetricStats(statsConfig: Record<string, any>, userId?: number): Promise<TopMetricStats>;
}


// Level 2 - Common patterns (implemented in each MediaRepository)
export interface ICommonRepository<TMedia, TList> extends IUniversalRepository<TMedia, TList> {
    computeAllUsersStats(): Promise<UserMediaStats[]>;
    getMediaToNotify(): Promise<ItemForNotification[]>;
    getListFilters(userId: number): Promise<ExpandedListFilters>;
    addMediaToUserList(userId: number, media: TMedia, newStatus: Status): Promise<TList>;
    findAllAssociatedDetails(mediaId: number): Promise<(TMedia & AddedMediaDetails) | undefined>;
    updateUserMediaDetails(userId: number, mediaId: number, updateData: Partial<TList>): Promise<TList>;
    getSearchListFilters(userId: number, query: string, job: JobType): Promise<{ name: string | null }[]>;
    getMediaJobDetails(userId: number, job: JobType, name: string, offset: number, limit?: number): Promise<JobDetails>;
}


// Level 3 - Media-specific methods
export interface IMoviesRepository extends ICommonRepository<Movie, MoviesList> {
    config: MovieSchemaConfig;

    lockOldMovies(): Promise<number>;
    getMediaIdsToBeRefreshed(): Promise<number[]>;
    getComingNext(userId: number): Promise<ComingNext[]>;
    updateMediaWithDetails({ mediaData, actorsData, genresData }: UpsertMovieWithDetails): Promise<boolean>;
    storeMediaWithDetails({ mediaData, actorsData, genresData }: UpsertMovieWithDetails): Promise<number | undefined>;

    // --- Achievements ----------------------------------------------------------
    getActorAchievementCte(_achievement: Achievement, userId?: number): any;
    getDurationAchievementCte(achievement: Achievement, userId?: number): any;
    getDirectorAchievementCte(_achievement: Achievement, userId?: number): any;
    getLanguageAchievementCte(achievement: Achievement, userId?: number): any;

    // --- Advanced Stats --------------------------------------------------------
    specificTopMetrics(userId?: number): Promise<MoviesTopMetricStats>;
    avgMovieDuration(userId?: number): Promise<number | null | undefined>;
    movieDurationDistrib(userId?: number): Promise<{ name: number, value: number }[]>;
    budgetRevenueStats(userId?: number): Promise<{ totalBudget: number | undefined, totalRevenue: number | undefined }>;
}


export interface ITvRepository extends ICommonRepository<TvType, TvList> {
    config: SeriesSchemaConfig | AnimeSchemaConfig;

    getComingNext(userId: number): Promise<ComingNext[]>;
    findByIdAndAddEpsPerSeason(mediaId: number): Promise<any>;
    getMediaIdsToBeRefreshed(apiIds: number[]): Promise<number[]>;
    updateMediaWithDetails({ mediaData, actorsData, genresData }: any): Promise<boolean>;
    getMediaEpsPerSeason(mediaId: number): Promise<{ season: number, episodes: number }[]>;
    storeMediaWithDetails({ mediaData, actorsData, genresData }: any): Promise<number | undefined>;

    // --- Achievements ----------------------------------------------------------
    getDurationAchievementCte(achievement: Achievement, userId?: number): any;
    getNetworkAchievementCte(achievement: Achievement, userId?: number): any;
    getActorAchievementCte(achievement: Achievement, userId?: number): any;

    // --- Advanced Stats --------------------------------------------------------
    computeTotalSeasons(userId?: number): Promise<any>;
    avgTvDuration(userId?: number): Promise<any>;
    tvDurationDistrib(userId?: number): Promise<any>;
    specificTopMetrics(userId?: number): Promise<TvTopMetricStats>;
}


export interface IGamesRepository extends ICommonRepository<Game, GamesList> {
    config: GamesSchemaConfig;

    getMediaIdsToBeRefreshed(): Promise<number[]>;
    getComingNext(userId: number): Promise<ComingNext[]>;
    updateMediaWithDetails({ mediaData, actorsData, genresData }: any): Promise<boolean>;
    storeMediaWithDetails({ mediaData, actorsData, genresData }: any): Promise<number | undefined>;
    // updateIGDBToken(): Promise<any>;

    // --- Achievements ----------------------------------------------------------
    getCompanyAchievementCte(achievement: Achievement, userId?: number): any;
    getDurationAchievementCte(achievement: Achievement, userId?: number): any;
    getGameModeAchievementCte(achievement: Achievement, userId?: number): any;
    getPlatformAchievementCte(achievement: Achievement, userId?: number): any;
    getTimeSpentAchievementCte(achievement: Achievement, userId?: number): any;
    getPerspectiveAchievementCte(achievement: Achievement, userId?: number): any;
    getSpecificPlatformAchievementCte(achievement: Achievement, userId?: number): any;

    // --- Advanced Stats --------------------------------------------------------
    gameAvgPlaytime(userId?: number): Promise<any>;
    gamePlaytimeDistrib(userId?: number): Promise<any>;
    specificTopMetrics(userId?: number): Promise<GamesTopMetricStats>;
    gameModesCount(userId?: number): Promise<any>;
}
