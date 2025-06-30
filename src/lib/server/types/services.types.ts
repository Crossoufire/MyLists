import {DeltaStats} from "@/lib/server/types/stats.types";
import {IProviderService} from "@/lib/server/types/provider.types";
import {JobType, MediaType, Status} from "@/lib/server/utils/enums";
import {TvList, TvType} from "@/lib/server/domain/media/tv/tv.types";
import {Game, GamesList} from "@/lib/server/domain/media/games/games.types";
import {Movie, MoviesList} from "@/lib/server/domain/media/movies/movies.types";
import {Achievement, AchievementData} from "@/lib/server/types/achievements.types";
import {
    AddMediaToUserList,
    AdvancedMediaStats,
    ComingNext,
    EditUserLabels,
    ExpandedListFilters,
    ItemForNotification,
    JobDetails,
    MediaAndUserDetails,
    MediaListArgs,
    MediaListData,
    SearchType,
    UpdateUserMediaDetails,
    UserMediaStats,
    UserMediaWithLabels
} from "@/lib/server/types/base.types";
import {Label} from "@/lib/components/types";


// Level 1 - Universal methods (implemented in BaseService)
export interface IUniversalService<TMedia, TList> {
    getCoverFilenames(): Promise<string[]>;
    getNonListMediaIds(): Promise<number[]>;
    computeAllUsersStats(): Promise<UserMediaStats[]>;
    getMediaToNotify(): Promise<ItemForNotification[]>;
    removeMediaByIds(mediaIds: number[]): Promise<void>;
    findById(mediaId: number): Promise<TMedia | undefined>;
    computeTotalMediaLabel(userId?: number): Promise<number>;
    getListFilters(userId: number): Promise<ExpandedListFilters>;
    getUserMediaLabels(userId: number): Promise<{ name: string }[]>;
    editUserLabel(args: EditUserLabels): Promise<Label | void | undefined>;
    searchByName(query: string, limit?: number): Promise<{ name: string }[]>;
    downloadMediaListAsCSV(userId: number): Promise<(TMedia & { mediaName: string })[] | undefined>;
    getSearchListFilters(userId: number, query: string, job: JobType): Promise<{ name: string | null }[]>;
    getMediaJobDetails(userId: number, job: JobType, name: string, search: SearchType): Promise<JobDetails>;
    getMediaList(currentUserId: number | undefined, userId: number, args: MediaListArgs): Promise<MediaListData>;
}


// Level 2 - Common patterns (implemented in each MediaService)
export interface ICommonService<TMedia, TList> extends IUniversalService<TMedia, TList> {
    getAchievementCte(achievement: Achievement, userId?: number): any;
    getAchievementsDefinition(mediaType?: MediaType): AchievementData[];
    calculateAdvancedMediaStats(userId?: number): Promise<AdvancedMediaStats>;
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
export interface IMoviesService extends ICommonService<Movie, MoviesList> {
    lockOldMovies(): Promise<number>;
    getComingNext(userId: number): Promise<ComingNext[]>;
}


export interface ITvService extends ICommonService<TvType, TvList> {
    getComingNext(userId: number): Promise<ComingNext[]>;
}


export interface IGamesService extends ICommonService<Game, GamesList> {
    getComingNext(userId: number): Promise<ComingNext[]>;
    // updateIGDBToken(): Promise<any>;
}


export type MediaService = IMoviesService | ITvService | IGamesService;