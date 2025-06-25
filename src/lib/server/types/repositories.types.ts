import {JobType, Status} from "@/lib/server/utils/enums";
import {Label} from "@/lib/components/user-media/LabelsDialog";
import {MediaListArgs} from "@/lib/server/types/media-lists.types";
import {EditUserLabels} from "@/lib/server/domain/media/base/base.repository";


// Level 1 - Universal methods (implemented in BaseRepository)
export interface IUniversalRepository {
    findById(mediaId: number | string): Promise<any | undefined>;
    downloadMediaListAsCSV(userId: number): Promise<any[]>;
    searchByName(query: string, limit?: number): Promise<{ name: string }[]>;
    removeMediaByIds(mediaIds: number[]): Promise<void>;
    getNonListMediaIds(): Promise<number[]>;
    getCoverFilenames(): Promise<{ imageCover: string }[]>;
    findByApiId(apiId: number | string): Promise<any | undefined>;
    findSimilarMedia(mediaId: number,): Promise<{ mediaId: number; mediaName: string; mediaCover: string | null }[]>;
    getUserMediaLabels(userId: number): Promise<{ name: string }[]>;
    editUserLabel(args: EditUserLabels): Promise<Label | void>;
    getUserFavorites(userId: number, limit?: number): Promise<any[]>;
    findUserMedia(userId: number, mediaId: number): Promise<any | null>;
    getUserFollowsMediaData(userId: number, mediaId: number): Promise<any[]>;
    getCommonListFilters(userId: number): Promise<{ genres: { name: string }[]; labels: { name: string }[] }>;
    getMediaList(currentUserId: number | undefined, userId: number, args: MediaListArgs): Promise<any>;
    computeTotalMediaLabel(userId?: number): Promise<number>;
}


// Level 2 - Common patterns (implemented in each MediaRepository)
export interface ICommonRepository extends IUniversalRepository {
    computeAllUsersStats(): Promise<any[]>;
    getMediaToNotify(): Promise<any[]>;
    removeMediaFromUserList(userId: number, mediaId: number): Promise<void>;
    addMediaToUserList(userId: number, mediaId: number, newStatus: Status): Promise<any>;
    getMediaJobDetails(userId: number, job: JobType, name: string, offset: number, limit?: number): Promise<any>;
    findAllAssociatedDetails(mediaId: number): Promise<any>;
    storeMediaWithDetails({ mediaData, actorsData, genresData }: any): Promise<number>;
    updateMediaWithDetails({ mediaData, actorsData, genresData }: any): Promise<boolean>;
    getSearchListFilters(userId: number, query: string, job: JobType): Promise<any[]>;
    getListFilters(userId: number): Promise<any>;
    updateUserMediaDetails(userId: number, mediaId: number, updateData: Record<string, any>): Promise<any>;
}


// Level 3 - Media-specific methods
export interface IMoviesRepository extends ICommonRepository {
    getComingNext(userId: number): Promise<any[]>;
    getMediaIdsToBeRefreshed(): Promise<any[]>;
    lockOldMovies(): Promise<number>;
}


export interface ITvRepository extends ICommonRepository {
    getComingNext(userId: number): Promise<any[]>;
    getMediaIdsToBeRefreshed(apiIds: number[]): Promise<number[]>;
}


export interface IGamesRepository extends ICommonRepository {
    getComingNext(userId: number): Promise<any[]>;
    getMediaIdsToBeRefreshed(): Promise<any[]>;
    // updateIGDBToken(): Promise<any>;
}
