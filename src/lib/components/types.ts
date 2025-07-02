import {MediaType} from "@/lib/server/utils/enums";
import {historyOptions, mediaDetailsOptions, mediaListOptions} from "@/lib/react-query/query-options/query-options";


export type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};


// --- Types for User Media Details ------------------------------------
export type MediaAndUserDetailsData = Awaited<ReturnType<NonNullable<ReturnType<typeof mediaDetailsOptions>["queryFn"]>>>;
export type HistoryType = Awaited<ReturnType<NonNullable<ReturnType<typeof historyOptions>["queryFn"]>>>
export type UserMedia = NonNullable<MediaAndUserDetailsData["userMedia"]>;

export type ExtractUserMediaByType<T extends MediaType> =
    T extends typeof MediaType.GAMES ? Extract<UserMedia, { playtime: number | null }> :
        T extends typeof MediaType.SERIES | typeof MediaType.ANIME ? Extract<UserMedia, { currentSeason: number }> :
            T extends typeof MediaType.MOVIES ? Exclude<UserMedia, { playtime: number | null } | { currentSeason: number }> :
                never;


// --- Types for Media Details ------------------------------------
export type MediaDetails = Prettify<MediaAndUserDetailsData["media"]>;

export type ExtractMediaDetailsByType<T extends MediaType> =
    T extends typeof MediaType.GAMES ? Extract<MediaDetails, { gameEngine: string | null }> :
        T extends typeof MediaType.SERIES | typeof MediaType.ANIME ? Extract<MediaDetails, { totalEpisodes: number | null }> :
            T extends typeof MediaType.MOVIES ? Extract<MediaDetails, { tagline: string | null }> :
                never;


// --- Types for Follows List ------------------------------------------
export type FollowData = MediaAndUserDetailsData["followsData"][0];
export type FollowUserMedia = FollowData["userMedia"];

export type ExtractFollowUserMediaByType<T extends MediaType> =
    T extends typeof MediaType.GAMES ? Extract<FollowUserMedia, { playtime: number | null }> :
        T extends (typeof MediaType.SERIES | typeof MediaType.ANIME) ? Extract<FollowUserMedia, { currentSeason: number }> :
            T extends typeof MediaType.MOVIES ? Exclude<FollowUserMedia, { playtime: number | null } | { currentSeason: number }> :
                never;

export type ExtractFollowByType<T extends MediaType> = FollowData & { userMedia: ExtractFollowUserMediaByType<T> }


// --- Types for Label Dialog ------------------------------------------
export type Label = { oldName?: string, name: string };
export type ToastType = { type: "error" | "success", message: string };


// --- Types for Media List ------------------------------------------
type MediaListType = Awaited<ReturnType<NonNullable<ReturnType<typeof mediaListOptions>["queryFn"]>>>;
export type ListUserData = MediaListType["userData"];
export type UserMediaItem = MediaListType["results"]["items"][0];
export type ListPagination = MediaListType["results"]["pagination"];

export type ExtractListByType<T extends MediaType> =
    T extends typeof MediaType.GAMES ? Extract<UserMediaItem, { playtime: number | null }> :
        T extends typeof MediaType.SERIES | typeof MediaType.ANIME ? Extract<UserMediaItem, { currentSeason: number }> :
            T extends typeof MediaType.MOVIES ? Exclude<UserMediaItem, { playtime: number | null } | { currentSeason: number }> :
                never;
