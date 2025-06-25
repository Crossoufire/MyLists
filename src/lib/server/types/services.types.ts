import {DeltaStats} from "@/lib/server/types/stats.types";
import {Achievement} from "@/lib/server/types/achievements";
import {Label} from "@/lib/components/user-media/LabelsDialog";
import {MediaListArgs} from "@/lib/server/types/media-lists.types";
import {JobType, MediaType, Status} from "@/lib/server/utils/enums";
import {EditUserLabels} from "@/lib/server/domain/media/base/base.repository";


// Level 1 - Universal methods (implemented in BaseService)
export interface IUniversalService {
    computeTotalMediaLabel(userId?: number): Promise<number>;
    getMediaToNotify(): Promise<any[]>;
    computeAllUsersStats(): Promise<any[]>;
    findById(mediaId: number | string): Promise<any | undefined>;
    downloadMediaListAsCSV(userId: number): Promise<any[]>;
    searchByName(query: string, limit?: number): Promise<{ name: string }[]>;
    removeMediaByIds(mediaIds: number[]): Promise<void>;
    getNonListMediaIds(): Promise<number[]>;
    getCoverFilenames(): Promise<string[]>;
    getUserMediaLabels(userId: number): Promise<{ name: string }[]>;
    editUserLabel(args: EditUserLabels): Promise<Label | void>;
    getMediaList(currentUserId: number | undefined, userId: number, args: MediaListArgs): Promise<any>;
    getListFilters(userId: number): Promise<any>;
    getSearchListFilters(userId: number, query: string, job: JobType): Promise<any[]>;
    getMediaJobDetails(userId: number, job: JobType, name: string, search: Record<string, any>): Promise<any>;
}


// Level 2 - Common patterns (implemented in each MediaService)
export interface ICommonService extends IUniversalService {
    addMediaToUserList(userId: number, mediaId: number, newStatus?: Status): Promise<any>;
    updateUserMediaDetails(userId: number, mediaId: number, updateData: Record<string, any>): Promise<any>;
    getAchievementCte(achievement: Achievement, userId?: number): Promise<string>;
    calculateAdvancedMediaStats(userId?: number): Promise<any>;
    getMediaAndUserDetails(userId: number, mediaId: number | string, external: boolean, providerService: any): Promise<any>;
    getMediaEditableFields(mediaId: number): Promise<{ fields: { [p: string]: any } }>;
    updateMediaEditableFields(mediaId: number, payload: Record<string, any>): Promise<void>;
    removeMediaFromUserList(userId: number, mediaId: number): Promise<DeltaStats>;
    completePartialUpdateData(partialUpdateData: Record<string, any>): Record<string, any>;
    calculateDeltaStats(oldState: any, newState: any, media: any): DeltaStats;
    getAchievementsDefinition(mediaType?: MediaType): any;
}


// Level 3 - Subset-specific methods (only some mediaTypes)
export interface IMoviesService extends ICommonService {
    getComingNext(userId: number): Promise<any[]>;
    lockOldMovies(): Promise<number>;
}


export interface ITvService extends ICommonService {
    getComingNext(userId: number): Promise<any[]>;
}


export interface IGamesService extends ICommonService {
    getComingNext(userId: number): Promise<any[]>;
    // updateIGDBToken(): Promise<any>;
}


export type MediaService = IMoviesService | ITvService | IGamesService;