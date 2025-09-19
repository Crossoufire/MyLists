import {queryOptions} from "@tanstack/react-query";
import {getCurrentUser} from "@/lib/server/functions/auth";
import {getTrendsMedia} from "@/lib/server/functions/trends";
import {getUserStats} from "@/lib/server/functions/user-stats";
import {getGlobalSearch, getSearchResults} from "@/lib/server/functions/search";
import {getHallOfFame} from "@/lib/server/functions/hall-of-fame";
import {getComingNextMedia} from "@/lib/server/functions/coming-next";
import {getPlatformStats} from "@/lib/server/functions/platform-stats";
import {ApiProviderType, JobType, MediaType} from "@/lib/server/utils/enums";
import {getUserAchievements} from "@/lib/server/functions/user-achievements";
import {getDailyMediadle, getMediadleSuggestions} from "@/lib/server/functions/moviedle";
import {getUserMediaHistory, getUserMediaLabels} from "@/lib/server/functions/user-media";
import {getNotifications, getNotificationsCount} from "@/lib/server/functions/notifications";
import {GlobalSearchType, MediaListArgs, SearchType, SearchTypeHoF} from "@/lib/types/zod.schema.types";
import {getJobDetails, getMediaDetails, getMediaDetailsToEdit} from "@/lib/server/functions/media-details";
import {getAllUpdatesHistory, getUserProfile, getUsersFollowers, getUsersFollows} from "@/lib/server/functions/user-profile";
import {getMediaListFilters, getMediaListSearchFilters, getMediaListServerFunction} from "@/lib/server/functions/media-lists";


export const queryKeys = {
    globalSearchKey: (search: GlobalSearchType) => ["globalSearch", search] as const,
    achievementPageKey: (username: string) => ["achievementPage", username] as const,
    authKey: () => ["currentUser"] as const,
    allUpdatesKey: (username: string, filters: SearchType) => ["allUpdates", username, filters] as const,
    dailyMediadleKey: () => ["dailyMediadle"] as const,
    detailsKey: (mediaType: MediaType, mediaId: string | number, external: boolean) => ["details", mediaType, mediaId, external] as const,
    editDetailsKey: (mediaType: MediaType, mediaId: string | number) => ["editDetails", mediaType, mediaId] as const,
    filterSearchKey: (mediaType: MediaType, username: string, query: string, job: JobType) =>
        ["filterSearch", mediaType, username, query, job] as const,
    followersKey: (username: string) => ["followers", username] as const,
    followsKey: (username: string) => ["follows", username] as const,
    platformStatsKey: (search: { mediaType?: MediaType }) => ["platformStats", search] as const,
    historyKey: (mediaType: MediaType, mediaId: string | number) => ["onOpenHistory", mediaType, mediaId] as const,
    hofKey: (search: SearchTypeHoF) => ["hof", search] as const,
    jobDetailsKey: (mediaType: MediaType, job: JobType, name: string, search: SearchType) =>
        ["jobDetails", mediaType, job, name, search] as const,
    labelsKey: (mediaType: MediaType) => ["labels", mediaType] as const,
    listFiltersKey: (mediaType: MediaType, username: string) => ["listFilters", mediaType, username] as const,
    mediadleSuggestionsKey: (query: string) => ["mediadleSuggestions", query] as const,
    navSearchKey: (query: string, page: number, selector: ApiProviderType) => ["navSearch", query, page, selector] as const,
    notificationCountKey: () => ["notificationCount"] as const,
    notificationsKey: () => ["notifications"] as const,
    profileKey: (username: string) => ["profile", username] as const,
    trendsKey: () => ["trends"] as const,
    upcomingKey: () => ["upcoming"] as const,
    userListKey: (mediaType: MediaType, username: string, search: MediaListArgs) =>
        ["userList", mediaType, username, search] as const,
    userStatsKey: (username: string, search: { mediaType?: MediaType }) => ["userStats", username, search] as const,
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
    enabled: query?.trim().length >= 2,
});


export const mediaDetailsOptions = (mediaType: MediaType, mediaId: number | string, external: boolean) => queryOptions({
    queryKey: queryKeys.detailsKey(mediaType, mediaId, external),
    queryFn: () => getMediaDetails({ data: { mediaType, mediaId, external } }),
    staleTime: 3 * 1000,
});


export const mediaListOptions = (mediaType: MediaType, username: string, search: MediaListArgs) => queryOptions({
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


export const allUpdatesOptions = (username: string, filters: SearchType) => queryOptions({
    queryKey: queryKeys.allUpdatesKey(username, filters),
    queryFn: () => getAllUpdatesHistory({ data: { ...filters, username } }),
});


export const hallOfFameOptions = (search: SearchTypeHoF) => queryOptions({
    queryKey: queryKeys.hofKey(search),
    queryFn: () => getHallOfFame({ data: search }),
});


export const globalSearchOptions = (search: GlobalSearchType) => queryOptions({
    queryKey: queryKeys.globalSearchKey(search),
    queryFn: () => getGlobalSearch({ data: search }),
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
    refetchInterval: 30 * 60 * 1000,
    enabled: false,
});


export const achievementOptions = (username: string) => queryOptions({
    queryKey: queryKeys.achievementPageKey(username),
    queryFn: () => getUserAchievements({ data: { username } }),
});


export const userStatsOptions = (username: string, search: { mediaType?: MediaType }) => queryOptions({
    queryKey: queryKeys.userStatsKey(username, search),
    queryFn: () => getUserStats({ data: { username, ...search } }),
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


export const platformStatsOptions = (search: { mediaType?: MediaType }) => queryOptions({
    queryKey: queryKeys.platformStatsKey(search),
    queryFn: () => getPlatformStats({ data: search }),
});