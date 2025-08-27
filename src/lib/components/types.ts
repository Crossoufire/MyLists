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
export type Media = NonNullable<MediaDetailsOptionsType["media"]>;
export type UserMedia = NonNullable<MediaDetailsOptionsType["userMedia"]>;
export type ExtractUserMediaByType<T extends MediaType> =
    T extends typeof MediaType.GAMES ? Extract<UserMedia, { playtime: any }> :
        T extends (typeof MediaType.SERIES | typeof MediaType.ANIME) ? Extract<UserMedia, { currentSeason: any }> :
            T extends typeof MediaType.BOOKS ? Extract<UserMedia, { actualPage: any }> :
                T extends typeof MediaType.MANGA ? Extract<UserMedia, { currentChapter: any }> :
                    T extends typeof MediaType.MOVIES ? Exclude<UserMedia, { playtime: any } | { currentSeason: any } | { actualPage: any } | { currentChapter: any }> :
                        never;

// --- Media Details Types ------------------------------------------------------------------
export type MediaDetails = Prettify<MediaDetailsOptionsType["media"]>;
export type ExtractMediaDetailsByType<T extends MediaType> =
    T extends typeof MediaType.GAMES ? Extract<MediaDetails, { gameEngine: any }> :
        T extends (typeof MediaType.SERIES | typeof MediaType.ANIME) ? Extract<MediaDetails, { totalEpisodes: any }> :
            T extends typeof MediaType.BOOKS ? Extract<MediaDetails, { pages: any }> :
                T extends typeof MediaType.MANGA ? Extract<MediaDetails, { chapters: any }> :
                    T extends typeof MediaType.MOVIES ? Extract<MediaDetails, { tagline: any }> :
                        never;


// --- Follows List Types -------------------------------------------------------------------
export type FollowData = MediaDetailsOptionsType["followsData"][0];
export type FollowUserMedia = FollowData["userMedia"];
export type ExtractFollowByType<T extends MediaType> = FollowData & { userMedia: ExtractFollowUserMediaByType<T> }
export type ExtractFollowUserMediaByType<T extends MediaType> =
    T extends typeof MediaType.GAMES ? Extract<FollowUserMedia, { playtime: any }> :
        T extends (typeof MediaType.SERIES | typeof MediaType.ANIME) ? Extract<FollowUserMedia, { currentSeason: any }> :
            T extends typeof MediaType.BOOKS ? Extract<FollowUserMedia, { actualPage: any }> :
                T extends typeof MediaType.MANGA ? Extract<FollowUserMedia, { currentChapter: any }> :
                    T extends typeof MediaType.MOVIES ? Exclude<FollowUserMedia, { playtime: any } | { currentSeason: any } | { actualPage: any }> :
                        never;


// --- Media List Types ---------------------------------------------------------------------
export type ListUserData = MediaListOptionsType["userData"];
export type UserMediaItem = MediaListOptionsType["results"]["items"][0];
export type ListPagination = MediaListOptionsType["results"]["pagination"];
export type ExtractListByType<T extends MediaType> =
    T extends typeof MediaType.GAMES ? Extract<UserMediaItem, { playtime: any }> :
        T extends typeof MediaType.BOOKS ? Extract<UserMediaItem, { actualPage: any }> :
            T extends typeof MediaType.MANGA ? Extract<UserMediaItem, { currentChapter: any }> :
                T extends (typeof MediaType.SERIES | typeof MediaType.ANIME) ? Extract<UserMediaItem, { currentSeason: any }> :
                    T extends typeof MediaType.MOVIES ? Exclude<UserMediaItem, { playtime: any } | { currentSeason: any } | { actualPage: any }> :
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
