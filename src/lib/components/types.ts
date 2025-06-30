import {MediaType} from "@/lib/server/utils/enums";
import {historyOptions, mediaDetailsOptions} from "@/lib/react-query/query-options/query-options";


export type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};


// --- Types for User Media Details ------------------------------------
export type MediaAndUserDetailsData = Awaited<ReturnType<NonNullable<ReturnType<typeof mediaDetailsOptions>["queryFn"]>>>;
export type UserMedia = MediaAndUserDetailsData["userMedia"];
export type HistoryType = Awaited<ReturnType<NonNullable<ReturnType<typeof historyOptions>["queryFn"]>>>

export type ExtractUserMediaByType<T extends MediaType> =
    T extends typeof MediaType.GAMES ? Extract<NonNullable<UserMedia>, { playtime: number | null }> :
        T extends typeof MediaType.SERIES | typeof MediaType.ANIME ? Extract<NonNullable<UserMedia>, { currentSeason: number }> :
            T extends typeof MediaType.MOVIES ? Exclude<NonNullable<UserMedia>, { playtime: number | null } | { currentSeason: number }> :
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
        T extends typeof MediaType.SERIES | typeof MediaType.ANIME ? Extract<FollowUserMedia, { currentSeason: number }> :
            T extends typeof MediaType.MOVIES ? Exclude<FollowUserMedia, { playtime: number | null } | { currentSeason: number }> :
                never;

type SpecificFollow<T extends MediaType> = {
    userMedia: ExtractFollowUserMediaByType<T>;
};

export type ExtractFollowsByType<T extends MediaType> = Extract<FollowData, SpecificFollow<T>>;


// --- Types for Label Dialog ------------------------------------------
export type Label = { oldName?: string, name: string };
export type ToastType = { type: "error" | "success", message: string };
