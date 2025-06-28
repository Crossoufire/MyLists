import {queryOptions} from "@tanstack/react-query";
import {getCurrentUser} from "@/lib/server/functions/auth";
import {getTrendsMedia} from "@/lib/server/functions/trends";
import {getUserStats} from "@/lib/server/functions/user-stats";
import {getSearchResults} from "@/lib/server/functions/search";
import {getHallOfFame} from "@/lib/server/functions/hall-of-fame";
import {getComingNextMedia} from "@/lib/server/functions/coming-next";
import {ApiProviderType, JobType, MediaType} from "@/lib/server/utils/enums";
import {getUserAchievements} from "@/lib/server/functions/user-achievements";
import {getDailyMediadle, getMediadleSuggestions} from "@/lib/server/functions/moviedle";
import {getUserMediaHistory, getUserMediaLabels} from "@/lib/server/functions/user-media";
import {getNotifications, getNotificationsCount} from "@/lib/server/functions/notifications";
import {getJobDetails, getMediaDetails, getMediaDetailsToEdit} from "@/lib/server/functions/media-details";
import {getMediaListFilters, getMediaListSearchFilters, getMediaListServerFunction} from "@/lib/server/functions/media-lists";
import {getAllUpdatesHistory, getUserProfile, getUsersFollowers, getUsersFollows} from "@/lib/server/functions/user-profile";
import {SearchType} from "@/lib/server/types/base.types";


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
    userStatsKey: QueryKeyFunction<[string, Record<string, any>]>;
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
    listFiltersKey: (mediaType, username) => ["listFilters", mediaType, username],
    mediadleSuggestionsKey: (query) => ["mediadleSuggestions", query],
    navSearchKey: (query, page, selector) => ["navSearch", query, page, selector],
    notificationCountKey: () => ["notificationCount"],
    notificationsKey: () => ["notifications"],
    profileKey: (username) => ["profile", username],
    trendsKey: () => ["trends"],
    upcomingKey: () => ["upcoming"],
    userListKey: (mediaType, username, search) => ["userList", mediaType, username, search],
    userStatsKey: (username, search) => ["userStats", username, search],
};


export const authOptions = () => queryOptions({
    queryKey: queryKeys.authKey(),
    queryFn: () => getCurrentUser(),
    staleTime: 10 * 60 * 1000,
});

export const profileOptions = (username: string) => queryOptions({
    queryKey: queryKeys.profileKey(username),
    queryFn: () => getUserProfile({ data: { username } }),
});

export const navSearchOptions = (query: string, page: number, apiProvider: ApiProviderType) => queryOptions({
    queryKey: queryKeys.navSearchKey(query, page, apiProvider),
    queryFn: () => getSearchResults({ data: { query, page, apiProvider } }),
    staleTime: 1000 * 60 * 2,
    enabled: query.trim().length >= 2,
});

export const mediaDetailsOptions = (mediaType: MediaType, mediaId: number | string, external: boolean) => queryOptions({
    queryKey: queryKeys.detailsKey(mediaType, mediaId),
    queryFn: () => getMediaDetails({ data: { mediaType, mediaId, external } }),
    staleTime: 3 * 1000,
});

export const mediaListOptions = (mediaType: MediaType, username: string, search: Record<string, any>) => queryOptions({
    queryKey: queryKeys.userListKey(mediaType, username, search),
    queryFn: () => getMediaListServerFunction({ data: { mediaType, username, args: search } }),
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

export const followersOptions = (username: string) => queryOptions({
    queryKey: queryKeys.followersKey(username),
    queryFn: () => getUsersFollowers({ data: { username } }),
});

export const followsOptions = (username: string) => queryOptions({
    queryKey: queryKeys.followsKey(username),
    queryFn: () => getUsersFollows({ data: { username } }),
});

export const allUpdatesOptions = (username: string, filters: Record<string, any>) => queryOptions({
    queryKey: queryKeys.allUpdatesKey(username, filters),
    queryFn: () => getAllUpdatesHistory({ data: { username, filters } }),
});

export const hallOfFameOptions = (search: Record<string, any>) => queryOptions({
    queryKey: queryKeys.hofKey(search),
    queryFn: () => getHallOfFame({ data: search }),
});

export const upcomingOptions = () => queryOptions({
    queryKey: queryKeys.upcomingKey(),
    queryFn: () => getComingNextMedia(),
});

export const dailyMediadleOptions = () => queryOptions({
    queryKey: queryKeys.dailyMediadleKey(),
    queryFn: () => getDailyMediadle(),
});

export const mediadleSuggestionsOptions = (query: string) => queryOptions({
    queryKey: queryKeys.mediadleSuggestionsKey(query),
    queryFn: () => getMediadleSuggestions({ data: { query } }),
    staleTime: 2 * 60 * 1000,
    enabled: query.length >= 2,
});

export const notificationsCountOptions = () => queryOptions({
    queryKey: queryKeys.notificationCountKey(),
    queryFn: () => getNotificationsCount(),
    meta: { errorMessage: "An error occurred fetching the notifications count" },
});

export const notificationsOptions = () => queryOptions({
    queryKey: queryKeys.notificationsKey(),
    queryFn: () => getNotifications(),
    meta: { errorMessage: "An error occurred fetching the notifications" },
    enabled: false,
});

export const achievementOptions = (username: string) => queryOptions({
    queryKey: queryKeys.achievementPageKey(username),
    queryFn: () => getUserAchievements({ data: { username } }),
});

export const userStatsOptions = (username: string, search: Record<string, any>) => queryOptions({
    queryKey: queryKeys.userStatsKey(username, search),
    queryFn: () => getUserStats({ data: { username, search } }),
});

export const historyOptions = (mediaType: MediaType, mediaId: number) => queryOptions({
    queryKey: queryKeys.historyKey(mediaType, mediaId),
    queryFn: () => getUserMediaHistory({ data: { mediaType, mediaId } }),
    staleTime: 10 * 1000,
    placeholderData: [],
});

export const userMediaLabelsOptions = (mediaType: MediaType, isOpen: boolean) => queryOptions({
    queryKey: queryKeys.labelsKey(mediaType),
    queryFn: () => getUserMediaLabels({ data: { mediaType } }),
    enabled: isOpen,
});

export const editMediaDetailsOptions = (mediaType: MediaType, mediaId: number) => queryOptions({
    queryKey: queryKeys.editDetailsKey(mediaType, mediaId),
    queryFn: () => getMediaDetailsToEdit({ data: { mediaType, mediaId } }),
    gcTime: 0,
    staleTime: 0,
});

export const jobDetailsOptions = (mediaType: MediaType, job: JobType, name: string, search: SearchType) => queryOptions({
    queryKey: queryKeys.jobDetailsKey(mediaType, job, name, search),
    queryFn: () => getJobDetails({ data: { mediaType, job, name, search } }),
});

export const trendsOptions = () => queryOptions({
    queryKey: queryKeys.trendsKey(),
    queryFn: () => getTrendsMedia(),
    meta: { errorMessage: "An error occurred fetching the trends. Please try again later." },
});
