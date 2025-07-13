import {SQL} from "drizzle-orm";
import {Label} from "@/lib/components/types";
import {Achievement} from "@/lib/server/types/achievements.types";
import {JobType, LabelAction, Status} from "@/lib/server/utils/enums";
import {GamesSchemaConfig} from "@/lib/server/domain/media/games/games.config";
import {MovieSchemaConfig} from "@/lib/server/domain/media/movies/movies.config";
import {AnimeSchemaConfig} from "@/lib/server/domain/media/tv/anime/anime.config";
import {SeriesSchemaConfig} from "@/lib/server/domain/media/tv/series/series.config";
import {TvList, TvTopMetricStats, TvType} from "@/lib/server/domain/media/tv/tv.types";
import {Game, GamesList, GamesTopMetricStats} from "@/lib/server/domain/media/games/games.types";
import {Movie, MoviesList, MoviesTopMetricStats, UpsertMovieWithDetails} from "@/lib/server/domain/media/movies/movies.types";
import {
    AddedMediaDetails,
    ComingNext,
    CommonListFilters,
    ConfigTopMetric,
    EpsPerSeasonType,
    ExpandedListFilters,
    ItemForNotification,
    JobDetails,
    MediaListArgs,
    MediaListData,
    SimpleMedia,
    TopMetricStats,
    UserFollowsMediaData,
    UserMediaStats,
    UserMediaWithLabels
} from "@/lib/server/types/base.types";


export type StatsCTE = any;


// Level 1 - Universal methods (implemented in BaseRepository)
export interface IUniversalRepository<TMedia, TList> {
    getNonListMediaIds(): Promise<number[]>;
    removeMediaByIds(mediaIds: number[]): Promise<void>;
    findById(mediaId: number): Promise<TMedia | undefined>;
    getCoverFilenames(): Promise<{ imageCover: string }[]>;
    computeTotalMediaLabel(userId?: number): Promise<number>;
    findSimilarMedia(mediaId: number): Promise<SimpleMedia[]>;
    getUserMediaLabels(userId: number): Promise<{ name: string }[]>;
    findByApiId(apiId: number | string): Promise<TMedia | undefined>;
    getCommonListFilters(userId: number): Promise<CommonListFilters>;
    removeMediaFromUserList(userId: number, mediaId: number): Promise<void>;
    searchByName(query: string, limit?: number): Promise<{ name: string }[]>;
    getUserFavorites(userId: number, limit?: number): Promise<SimpleMedia[]>;
    findUserMedia(userId: number, mediaId: number): Promise<UserMediaWithLabels<TList> | null>;
    downloadMediaListAsCSV(userId: number): Promise<(TMedia & { mediaName: string })[] | undefined>;
    getUserFollowsMediaData(userId: number, mediaId: number): Promise<UserFollowsMediaData<TList>[]>;
    updateUserMediaDetails(userId: number, mediaId: number, updateData: Partial<TList>): Promise<TList>;
    getMediaList(currentUserId: number | undefined, userId: number, args: MediaListArgs): Promise<MediaListData<TList>>;
    editUserLabel(userId: number, label: Label, mediaId: number, action: LabelAction): Promise<Label | undefined | void>;

    // --- Achievements ----------------------------------------------------------
    specificGenreAchievementCte(achievement: Achievement, userId?: number): Promise<StatsCTE>;
    applyWhereConditionsAndGrouping(cte: StatsCTE, baseConditions: SQL[], userId?: number): StatsCTE;
    countAchievementCte(condition: SQL, achievement: Achievement, userId?: number): Promise<StatsCTE>;

    // --- Advanced Stats ---------------------------------------------------
    computeTotalMediaLabel(userId?: number): Promise<number>;
    computeTopGenresStats(userId?: number): Promise<TopMetricStats>;
    computeRatingStats(userId?: number): Promise<{ name: string, value: number }[]>;
    computeReleaseDateStats(userId?: number): Promise<{ name: number, value: number }[]>;
    computeTopMetricStats(statsConfig: ConfigTopMetric, userId?: number): Promise<TopMetricStats>;
}


// Level 2 - Common patterns (implemented in each MediaRepository)
export interface ICommonRepository<TMedia, TList> extends IUniversalRepository<TMedia, TList> {
    computeAllUsersStats(): Promise<UserMediaStats[]>;
    getMediaToNotify(): Promise<ItemForNotification[]>;
    getListFilters(userId: number): Promise<ExpandedListFilters>;
    addMediaToUserList(userId: number, media: TMedia, newStatus: Status): Promise<TList>;
    findAllAssociatedDetails(mediaId: number): Promise<(TMedia & AddedMediaDetails) | undefined>;
    getSearchListFilters(userId: number, query: string, job: JobType): Promise<{ name: string | null }[]>;
    getMediaJobDetails(userId: number, job: JobType, name: string, offset: number, limit?: number): Promise<JobDetails>;
}


// Level 3 - Media-specific methods
export interface IMoviesRepository extends ICommonRepository<Movie, MoviesList> {
    config: MovieSchemaConfig;

    lockOldMovies(): Promise<number>;
    getMediaIdsToBeRefreshed(): Promise<number[]>;
    getComingNext(userId: number): Promise<ComingNext[]>;
    storeMediaWithDetails({ mediaData, actorsData, genresData }: UpsertMovieWithDetails): Promise<number>;
    updateMediaWithDetails({ mediaData, actorsData, genresData }: UpsertMovieWithDetails): Promise<boolean>;

    // --- Achievements ----------------------------------------------------------
    getActorAchievementCte(_achievement: Achievement, userId?: number): StatsCTE;
    getDurationAchievementCte(achievement: Achievement, userId?: number): StatsCTE;
    getLanguageAchievementCte(achievement: Achievement, userId?: number): StatsCTE;
    getDirectorAchievementCte(_achievement: Achievement, userId?: number): StatsCTE;

    // --- Advanced Stats --------------------------------------------------------
    avgMovieDuration(userId?: number): Promise<number>;
    specificTopMetrics(userId?: number): Promise<MoviesTopMetricStats>;
    movieDurationDistrib(userId?: number): Promise<{ name: number, value: number }[]>;
    budgetRevenueStats(userId?: number): Promise<{ totalBudget: number | undefined, totalRevenue: number | undefined }>;
}


export interface ITvRepository extends ICommonRepository<TvType, TvList> {
    config: SeriesSchemaConfig | AnimeSchemaConfig;

    getComingNext(userId: number): Promise<ComingNext[]>;
    findByIdAndAddEpsPerSeason(mediaId: number): Promise<TvType>;
    getMediaIdsToBeRefreshed(apiIds: number[]): Promise<number[]>;
    getMediaEpsPerSeason(mediaId: number): Promise<EpsPerSeasonType>;
    storeMediaWithDetails({ mediaData, actorsData, genresData }: any): Promise<number>;
    updateMediaWithDetails({ mediaData, actorsData, genresData }: any): Promise<boolean>;

    // --- Achievements ----------------------------------------------------------
    getActorAchievementCte(achievement: Achievement, userId?: number): StatsCTE;
    getNetworkAchievementCte(achievement: Achievement, userId?: number): StatsCTE;
    getDurationAchievementCte(achievement: Achievement, userId?: number): StatsCTE;

    // --- Advanced Stats ---------------------------------------------------------
    avgTvDuration(userId?: number): Promise<number>;
    specificTopMetrics(userId?: number): Promise<TvTopMetricStats>;
    computeTotalSeasons(userId?: number): Promise<number | undefined>;
    tvDurationDistrib(userId?: number): Promise<{ name: number, value: number }[]>;
}


export interface IGamesRepository extends ICommonRepository<Game, GamesList> {
    config: GamesSchemaConfig;

    getMediaIdsToBeRefreshed(): Promise<number[]>;
    getComingNext(userId: number): Promise<ComingNext[]>;
    storeMediaWithDetails({ mediaData, actorsData, genresData }: any): Promise<number>;
    updateMediaWithDetails({ mediaData, actorsData, genresData }: any): Promise<boolean>;
    // updateIGDBToken(): Promise<any>;

    // --- Achievements ----------------------------------------------------------
    getCompanyAchievementCte(achievement: Achievement, userId?: number): StatsCTE;
    getDurationAchievementCte(achievement: Achievement, userId?: number): StatsCTE;
    getGameModeAchievementCte(achievement: Achievement, userId?: number): StatsCTE;
    getPlatformAchievementCte(achievement: Achievement, userId?: number): StatsCTE;
    getTimeSpentAchievementCte(achievement: Achievement, userId?: number): StatsCTE;
    getPerspectiveAchievementCte(achievement: Achievement, userId?: number): StatsCTE;
    getSpecificPlatformAchievementCte(achievement: Achievement, userId?: number): StatsCTE;

    // --- Advanced Stats --------------------------------------------------------
    gameAvgPlaytime(userId?: number): Promise<number>;
    specificTopMetrics(userId?: number): Promise<GamesTopMetricStats>;
    gamePlaytimeDistrib(userId?: number): Promise<{ name: number, value: number }[]>;
    gameModesCount(userId?: number): Promise<{ topValues: { name: string, value: number }[] }>;
}
