import {queryOptions} from "@tanstack/react-query";
import {getCurrentUser} from "@/lib/server/functions/user";
import {getUserProfile} from "@/lib/server/functions/profile";
import {getSearchResults} from "@/lib/server/functions/search";
import {getMediaDetails} from "@/lib/server/functions/media-details";
import {ApiProviderType, JobType, MediaType} from "@/lib/server/utils/enums";
import {getMediaListFilters, getMediaListSearchFilters, serverGetMediaList} from "@/lib/server/functions/media-lists";


type QueryKeyFunction<T extends any[]> = (...args: T) => (string | any)[];


type QueryKeys = {
    achievementPageKey: QueryKeyFunction<[string]>;
    authKey: QueryKeyFunction<[]>;
    allUpdatesKey: QueryKeyFunction<[string, Record<string, any>]>;
    dailyMediadleKey: QueryKeyFunction<[]>;
    detailsKey: QueryKeyFunction<[MediaType, string | number]>;
    editDetailsKey: QueryKeyFunction<[MediaType, string | number]>;
    filterSearchKey: QueryKeyFunction<[MediaType, string, string, JobType]>;
    followersKey: QueryKeyFunction<[string]>;
    followsKey: QueryKeyFunction<[string]>;
    globalStatsKey: QueryKeyFunction<[Record<string, any>]>;
    historyKey: QueryKeyFunction<[MediaType, string | number]>;
    hofKey: QueryKeyFunction<[Record<string, any>]>;
    jobDetailsKey: QueryKeyFunction<[MediaType, JobType, string, Record<string, any>]>;
    labelsKey: QueryKeyFunction<[MediaType]>;
    navSearchKey: QueryKeyFunction<[string, number, string]>;
    notificationCountKey: QueryKeyFunction<[]>;
    notificationsKey: QueryKeyFunction<[]>;
    mediadleSuggestionsKey: QueryKeyFunction<[string]>;
    profileKey: QueryKeyFunction<[string]>;
    listFiltersKey: QueryKeyFunction<[MediaType, string]>;
    statsKey: QueryKeyFunction<[string, Record<string, any>]>;
    trendsKey: QueryKeyFunction<[]>;
    upcomingKey: QueryKeyFunction<[]>;
    userListKey: QueryKeyFunction<[MediaType, string, Record<string, any>]>;
};


export const queryKeys: QueryKeys = {
    achievementPageKey: (username) => ["achievementPage", username],
    authKey: () => ["currentUser"],
    allUpdatesKey: (username, filters) => ["allUpdates", username, filters],
    dailyMediadleKey: () => ["dailyMediadle"],
    detailsKey: (mediaType, mediaId) => ["details", mediaType, mediaId],
    editDetailsKey: (mediaType, mediaId) => ["editDetails", mediaType, mediaId],
    filterSearchKey: (mediaType, username, query, job) => ["filterSearch", mediaType, username, query, job],
    followersKey: (username) => ["followers", username],
    followsKey: (username) => ["follows", username],
    globalStatsKey: (search) => ["globalStats", search],
    historyKey: (mediaType, mediaId) => ["onOpenHistory", mediaType, mediaId],
    hofKey: (search) => ["hof", search],
    jobDetailsKey: (mediaType, job, name, search) => ["jobDetails", mediaType, job, name, search],
    labelsKey: (mediaType) => ["labels", mediaType],
    navSearchKey: (query, page, selector) => ["navSearch", query, page, selector],
    notificationCountKey: () => ["notificationCount"],
    notificationsKey: () => ["notifications"],
    mediadleSuggestionsKey: (query) => ["mediadleSuggestions", query],
    profileKey: (username) => ["profile", username],
    listFiltersKey: (mediaType, username) => ["listFilters", mediaType, username],
    statsKey: (username, search) => ["stats", username, search],
    trendsKey: () => ["trends"],
    upcomingKey: () => ["upcoming"],
    userListKey: (mediaType, username, search) => ["userList", mediaType, username, search],
};


export const authOptions = () => queryOptions({
    queryKey: queryKeys.authKey(),
    queryFn: () => getCurrentUser(),
    staleTime: 5 * 60 * 1000,
});

export const profileOptions = (username: string) => queryOptions({
    queryKey: queryKeys.profileKey(username),
    queryFn: () => getUserProfile({ data: { username } }),
});

export const navSearchOptions = (query: string, page: number, apiProvider: ApiProviderType) => queryOptions({
    queryKey: queryKeys.navSearchKey(query, page, apiProvider),
    queryFn: () => getSearchResults({ data: { query, page, apiProvider } }),
    staleTime: 1000 * 60 * 2,
    enabled: query.length >= 2,
});

export const mediaDetailsOptions = (mediaType: MediaType, mediaId: number | string, external: boolean) => queryOptions({
    queryKey: queryKeys.detailsKey(mediaType, mediaId),
    queryFn: () => getMediaDetails({ data: { mediaType, mediaId, external } }),
    staleTime: 3 * 1000,
});

export const mediaListOptions = (mediaType: MediaType, username: string, search: Record<string, any>) => queryOptions({
    queryKey: queryKeys.userListKey(mediaType, username, search),
    queryFn: () => serverGetMediaList({ data: { mediaType, username, args: search } }),
});

export const listFiltersOptions = (mediaType: MediaType, username: string) => queryOptions({
    queryKey: queryKeys.listFiltersKey(mediaType, username),
    queryFn: () => getMediaListFilters({ data: { mediaType, username } }),
    staleTime: Infinity,
});

export const filterSearchOptions = (mediaType: MediaType, username: string, query: string, job: JobType) => queryOptions({
    queryKey: queryKeys.filterSearchKey(mediaType, username, query, job),
    queryFn: () => getMediaListSearchFilters({ data: { mediaType, username, query, job } }),
    staleTime: 2 * 60 * 1000,
    enabled: query.length >= 2,
});
