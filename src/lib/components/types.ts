import {JobType, MediaType} from "@/lib/server/utils/enums";
import {MediaListArgs} from "@/lib/server/types/base.types";
import {historyOptions, listFiltersOptions, mediaDetailsOptions, mediaListOptions, profileOptions} from "@/lib/react-query/query-options/query-options";


export type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};


// --- Inferred Options Types -------------------------------------
export type HistoryOptionsType = Awaited<ReturnType<NonNullable<ReturnType<typeof historyOptions>["queryFn"]>>>;
export type ProfileOptionsType = Awaited<ReturnType<NonNullable<ReturnType<typeof profileOptions>["queryFn"]>>>;
export type MediaListOptionsType = Awaited<ReturnType<NonNullable<ReturnType<typeof mediaListOptions>["queryFn"]>>>;
export type ListFiltersOptionsType = Awaited<ReturnType<NonNullable<ReturnType<typeof listFiltersOptions>["queryFn"]>>>;
export type MediaDetailsOptionsType = Awaited<ReturnType<NonNullable<ReturnType<typeof mediaDetailsOptions>["queryFn"]>>>;


// --- User Media Details Types -------------------------------------------------------------
export type UserMedia = NonNullable<MediaDetailsOptionsType["userMedia"]>;
export type ExtractUserMediaByType<T extends MediaType> =
    T extends typeof MediaType.GAMES ? Extract<UserMedia, { playtime: number | null }> :
        T extends typeof MediaType.SERIES | typeof MediaType.ANIME ? Extract<UserMedia, { currentSeason: number | null }> :
            T extends typeof MediaType.MOVIES ? Exclude<UserMedia, { playtime: number | null } | { currentSeason: number | null }> :
                never;


// --- Media Details Types ------------------------------------------------------------------
export type MediaDetails = Prettify<MediaDetailsOptionsType["media"]>;
export type ExtractMediaDetailsByType<T extends MediaType> =
    T extends typeof MediaType.GAMES ? Extract<MediaDetails, { gameEngine: string | null }> :
        T extends typeof MediaType.SERIES | typeof MediaType.ANIME ? Extract<MediaDetails, { totalEpisodes: number | null }> :
            T extends typeof MediaType.MOVIES ? Extract<MediaDetails, { tagline: string | null }> :
                never;


// --- Follows List Types -------------------------------------------------------------------
export type FollowData = MediaDetailsOptionsType["followsData"][0];
export type FollowUserMedia = FollowData["userMedia"];
export type ExtractFollowByType<T extends MediaType> = FollowData & { userMedia: ExtractFollowUserMediaByType<T> }
export type ExtractFollowUserMediaByType<T extends MediaType> =
    T extends typeof MediaType.GAMES ? Extract<FollowUserMedia, { playtime: number | null }> :
        T extends (typeof MediaType.SERIES | typeof MediaType.ANIME) ? Extract<FollowUserMedia, { currentSeason: number }> :
            T extends typeof MediaType.MOVIES ? Exclude<FollowUserMedia, { playtime: number | null } | { currentSeason: number }> :
                never;


// --- Media List Types ---------------------------------------------------------------------
export type ListUserData = MediaListOptionsType["userData"];
export type UserMediaItem = MediaListOptionsType["results"]["items"][0];
export type ListPagination = MediaListOptionsType["results"]["pagination"];
export type ExtractListByType<T extends MediaType> =
    T extends typeof MediaType.GAMES ? Extract<UserMediaItem, { playtime: number | null }> :
        T extends typeof MediaType.SERIES | typeof MediaType.ANIME ? Extract<UserMediaItem, { currentSeason: number }> :
            T extends typeof MediaType.MOVIES ? Exclude<UserMediaItem, { playtime: number | null } | { currentSeason: number }> :
                never;


// --- Types for Filters Side Sheet ------------------------------------
export type FilterConfig = {
    job?: JobType;
    title: string;
    key: keyof MediaListArgs;
    type: "checkbox" | "search";
    renderLabel?: (name: string, mediaType: MediaType) => string;
    getItems?: (data: ListFiltersOptionsType) => { name: string }[] | undefined;
};


// --- Types for ProfileOptions ------------------------------------
export type UserDataType = ProfileOptionsType["userData"];
export type UserFollowsType = ProfileOptionsType["userFollows"];
export type UserUpdateType = ProfileOptionsType["userUpdates"][0];
export type AchievementsType = ProfileOptionsType["achievements"];
export type PerMediaSummaryType = ProfileOptionsType["perMediaSummary"];
export type MediaGlobalSummaryType = ProfileOptionsType["mediaGlobalSummary"];
export type UserSettingsType = ProfileOptionsType["userData"]["userMediaSettings"];


// --- Labels Dialog Types ------------------------------------------------------------------
export type Label = { oldName?: string, name: string };
