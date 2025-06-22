import {Column, SQL, Table} from "drizzle-orm";
import {ApiProviderType, MediaType} from "@/lib/server/utils/enums";
import {authOptions} from "@/lib/react-query/query-options/query-options";
import {EditUserLabels} from "@/lib/server/domain/media/base/base.repository";
import {MediaListArgs, MediaTable} from "@/lib/server/types/media-lists.types";


export interface IService {
    findById(id: number): Promise<any>;
    downloadMediaListAsCSV(userId: number): Promise<any>;
    searchByName(query: string): Promise<any>;
    findByApiId(apiId: number): Promise<any>;
    removeMediaByIds(mediaIds: number[]): Promise<any>;
    getNonListMediaIds(): Promise<number[]>;
    getCoverFilenames(): Promise<{ imageCover: string }[]>;
    getMediaToNotify(): Promise<any[]>;
    getMediaJobDetails(userId: number, job: string, name: string, offset: number, limit?: number): Promise<any>;
    getSearchListFilters(userId: number, query: string, job: string): Promise<{ name: string | null }[]>;
    getListFilters(userId: number): Promise<any>;
    editUserLabel({ userId, label, mediaId, action }: EditUserLabels): Promise<any>;
    getMediaList(currentUserId: number | undefined, userId: number, args: any): Promise<any>;
    getUserMediaLabels(userId: number): Promise<{ name: any }[]>;
    computeTotalMediaLabel(userId?: number): Promise<number>;
    computeAllUsersStats(): Promise<any>;
    findAllAssociatedDetails(id: number): Promise<any>;
    findSimilarMedia(id: number): Promise<any>;
    findUserMedia(userId: number, mediaId: number): Promise<any>;
    findAllUserMedia(userId: number): Promise<any>;
    getUserFollowsMediaData(userId: number, mediaId: number): Promise<any>;
    getAchievementCte(mediaId: number): Promise<string>;
    calculateAdvancedMediaStats(userId?: number): Promise<any>;
    getMediaAndUserDetails(userId: number, mediaId: number | string, external: boolean, providerService: any): Promise<any>;
    getMediaEditableFields(mediaId: number): Promise<any>;
    updateMediaEditableFields(mediaId: number, payload: Record<string, any>): Promise<any>;
    getComingNext(userId: number): Promise<any>;
    addMediaToUserList(userId: number, mediaId: number, status?: string): Promise<any>;
    updateUserMediaDetails(userId: number, mediaId: number, partialUpdateData: Record<string, any>): Promise<any>;
    removeMediaFromUserList(userId: number, mediaId: number): Promise<any>;
    getMediaEditableFields(mediaId: number): Promise<{ fields: { [p: string]: any } }>
    getComingNext(userId: number): Promise<any>;
    addMediaToUserList(userId: number, mediaId: number, status?: string): Promise<any>;
    getAchievementsDefinition(): any;
}


export interface ListFilterDefinition {
    mediaTable: MediaTable;
    argName: keyof MediaListArgs;
    filterColumn: Column<any, any, any>;
    entityTable: Table & { mediaId: Column<any, any, any> };
}


export interface FilterDefinition {
    isActive: (args: MediaListArgs) => boolean;
    getCondition: (args: MediaListArgs) => SQL | undefined;
}


export type FilterDefinitions = Partial<Record<keyof MediaListArgs, FilterDefinition>>;


export type CurrentUser = ReturnType<typeof authOptions>["queryFn"];


export interface ProviderSearchResults {
    id: number | string
    date: string | undefined | null
    name: string | undefined | null
    image: string | undefined | null
    itemType: MediaType | ApiProviderType
}