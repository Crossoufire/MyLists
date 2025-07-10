import {Label} from "@/lib/components/types";
import {DeltaStats} from "@/lib/server/types/stats.types";
import {IProviderService} from "@/lib/server/types/provider.types";
import {TvList, TvType} from "@/lib/server/domain/media/tv/tv.types";
import {Game, GamesList} from "@/lib/server/domain/media/games/games.types";
import {Movie, MoviesList} from "@/lib/server/domain/media/movies/movies.types";
import {JobType, LabelAction, MediaType, Status} from "@/lib/server/utils/enums";
import {Achievement, AchievementData} from "@/lib/server/types/achievements.types";
import {
    AddMediaToUserList,
    ComingNext,
    GamesAdvancedStats,
    ItemForNotification,
    JobDetails,
    MediaAndUserDetails,
    MediaListArgs,
    MediaListData,
    MoviesAdvancedStats,
    SearchType,
    TvAdvancedStats,
    UpdateUserMediaDetails,
    UserMediaStats,
    UserMediaWithLabels
} from "@/lib/server/types/base.types";


// Level 1 - Universal methods (implemented in BaseService)
export interface IUniversalService<TMedia, TList> {
    getCoverFilenames(): Promise<string[]>;
    getNonListMediaIds(): Promise<number[]>;
    computeAllUsersStats(): Promise<UserMediaStats[]>;
    getMediaToNotify(): Promise<ItemForNotification[]>;
    removeMediaByIds(mediaIds: number[]): Promise<void>;
    findById(mediaId: number): Promise<TMedia | undefined>;
    computeTotalMediaLabel(userId?: number): Promise<number>;
    getUserMediaLabels(userId: number): Promise<{ name: string }[]>;
    getAchievementCte(achievement: Achievement, userId?: number): any;
    searchByName(query: string, limit?: number): Promise<{ name: string }[]>;
    downloadMediaListAsCSV(userId: number): Promise<(TMedia & { mediaName: string })[] | undefined>;
    getSearchListFilters(userId: number, query: string, job: JobType): Promise<{ name: string | null }[]>;
    getMediaJobDetails(userId: number, job: JobType, name: string, search: SearchType): Promise<JobDetails>;
    getMediaList(currentUserId: number | undefined, userId: number, args: MediaListArgs): Promise<MediaListData<TList>>;
    editUserLabel(userId: number, label: Label, mediaId: number, action: LabelAction): Promise<Label | void | undefined>;
}


// Level 2 - Common patterns (implemented in each MediaService)
export interface ICommonService<TMedia, TList, TStats> extends IUniversalService<TMedia, TList> {
    calculateAdvancedMediaStats(userId?: number): Promise<TStats>;
    getAchievementsDefinition(mediaType?: MediaType): AchievementData[];
    removeMediaFromUserList(userId: number, mediaId: number): Promise<DeltaStats>;
    getMediaEditableFields(mediaId: number): Promise<{ fields: Record<string, any> }>
    updateMediaEditableFields(mediaId: number, payload: Record<string, any>): Promise<void>;
    calculateDeltaStats(oldState: UserMediaWithLabels<TList>, newState: TList, media: TMedia): DeltaStats;
    completePartialUpdateData(partialUpdateData: Record<string, any>, userMedia?: TList): Record<string, any>;
    addMediaToUserList(userId: number, mediaId: number, newStatus?: Status): Promise<AddMediaToUserList<TMedia, TList>>;
    updateUserMediaDetails(userId: number, mediaId: number, updateData: Record<string, any>): Promise<UpdateUserMediaDetails<TMedia, TList>>;
    getMediaAndUserDetails(userId: number, mediaId: number | string, external: boolean, providerService: IProviderService): Promise<MediaAndUserDetails<TMedia, TList>>;
}


// Level 3 - Subset-specific methods (only some mediaTypes)
export interface IMoviesService extends ICommonService<Movie, MoviesList, MoviesAdvancedStats> {
    lockOldMovies(): Promise<number>;
    getComingNext(userId: number): Promise<ComingNext[]>;
}


export interface ITvService extends ICommonService<TvType, TvList, TvAdvancedStats> {
    getComingNext(userId: number): Promise<ComingNext[]>;
}


export interface IGamesService extends ICommonService<Game, GamesList, GamesAdvancedStats> {
    getComingNext(userId: number): Promise<ComingNext[]>;
    // updateIGDBToken(): Promise<any>;
}


export type MediaService = IMoviesService | ITvService | IGamesService;