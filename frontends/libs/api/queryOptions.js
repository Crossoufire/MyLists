import {fetcher} from "./utils";
import {getApiClient} from "./apiClient";
import {queryOptions} from "@tanstack/react-query";


export const queryKeys = {
    authKey: () => ["currentUser"],
    historyKey: (mediaType, mediaId) => ["onOpenHistory", mediaType, mediaId],
    detailsKey: (mediaType, mediaId) => ["details", mediaType, mediaId],
    profileKey: (username) => ["profile", username],
    allUpdatesKey: (username, filters) => ["allUpdates", username, filters],
    trendsKey: () => ["trends"],
    upcomingKey: () => ["upcoming"],
    globalStatsKey: () => ["globalStats"],
    jobDetailsKey: (mediaType, job, name) => ["jobDetails", mediaType, job, name],
    editDetailsKey: (mediaType, mediaId) => ["editDetails", mediaType, mediaId],
    userListKey: (mediaType, username, search) => ["userList", mediaType, username, search],
    followersKey: (username) => ["followers", username],
    followsKey: (username) => ["follows", username],
    statsKey: (mediaType, username) => ["stats", mediaType, username],
    hofKey: (search) => ["hof", search],
    smallFiltersKey: (mediaType, username) => ["smallFilters", mediaType, username],
    labelsKey: (mediaType) => ["labels", mediaType],
    navSearchKey: (query, page, selector) => ["navSearch", query, page, selector],
    notificationCountKey: () => ["notificationCount"],
    notificationsKey: () => ["notifications"],
    filterSearchKey: (mediaType, username, query, job) => ["filterSearch", mediaType, username, query, job],
    achievementPageKey: (username) => ["achievementPage", username],
    dailyMediadleKey: () => ["dailyMediadle"],
    mediadleSuggestionsKey: (query) => ["mediadleSuggestions", query],
};


export const authOptions = () => queryOptions({
    queryKey: queryKeys.authKey(),
    queryFn: () => getApiClient().fetchCurrentUser(),
    staleTime: Infinity,
});


export const historyOptions = (mediaType, mediaId) => queryOptions({
    queryKey: queryKeys.historyKey(mediaType, mediaId),
    queryFn: () => fetcher({ url: `/history/${mediaType}/${mediaId}` }),
    staleTime: 10 * 1000,
    placeholderData: [],
});


export const detailsOptions = (mediaType, mediaId, external) => queryOptions({
    queryKey: queryKeys.detailsKey(mediaType, mediaId),
    queryFn: () => fetcher({ url: `/details/${mediaType}/${mediaId}`, queryOrData: { external } }),
    staleTime: 2 * 1000,
});


export const profileOptions = (username) => queryOptions({
    queryKey: queryKeys.profileKey(username),
    queryFn: () => fetcher({ url: `/profile/${username}` }),
});


export const allUpdatesOptions = (username, filters) => queryOptions({
    queryKey: queryKeys.allUpdatesKey(username, filters),
    queryFn: () => fetcher({ url: `/profile/${username}/history`, queryOrData: filters }),
});


export const trendsOptions = () => queryOptions({
    queryKey: queryKeys.trendsKey(),
    queryFn: () => fetcher({ url: "/current_trends" }),
    meta: { errorMessage: "An error occurred fetching the trends. Please try again later." },
});


export const upcomingOptions = () => queryOptions({
    queryKey: queryKeys.upcomingKey(),
    queryFn: () => fetcher({ url: "/coming_next" }),
});


export const globalStatsOptions = () => queryOptions({
    queryKey: queryKeys.globalStatsKey(),
    queryFn: () => fetcher({ url: "/mylists_stats" }),
});


export const jobDetailsOptions = (mediaType, job, name) => queryOptions({
    queryKey: queryKeys.jobDetailsKey(mediaType, job, name),
    queryFn: () => fetcher({ url: `/details/${mediaType}/${job}/${name}` }),
});


export const editMediaOptions = (mediaType, mediaId) => queryOptions({
    queryKey: queryKeys.editDetailsKey(mediaType, mediaId),
    queryFn: () => fetcher({ url: `/details/edit/${mediaType}/${mediaId}` }),
    gcTime: 0,
    staleTime: 0,
});


export const listOptions = (mediaType, username, search) => queryOptions({
    queryKey: queryKeys.userListKey(mediaType, username, search),
    queryFn: () => fetcher({ url: `/list/${mediaType}/${username}`, queryOrData: search }),
});


export const followersOptions = (username) => queryOptions({
    queryKey: queryKeys.followersKey(username),
    queryFn: () => fetcher({ url: `/profile/${username}/followers` }),
});


export const followsOptions = (username) => queryOptions({
    queryKey: queryKeys.followsKey(username),
    queryFn: () => fetcher({ url: `/profile/${username}/follows` }),
});


export const statsOptions = (mediaType, username) => queryOptions({
    queryKey: queryKeys.statsKey(mediaType, username),
    queryFn: () => fetcher({ url: `/stats/${mediaType}/${username}` }),
});


export const hallOfFameOptions = (search) => queryOptions({
    queryKey: queryKeys.hofKey(search),
    queryFn: () => fetcher({ url: "/hall_of_fame", queryOrData: search }),
});


export const smallFiltersOptions = (mediaType, username) => queryOptions({
    queryKey: queryKeys.smallFiltersKey(mediaType, username),
    queryFn: () => fetcher({ url: `/list/filters/${mediaType}/${username}` }),
    staleTime: Infinity,
});


export const mediaLabelsOptions = (mediaType, isOpen) => queryOptions({
    queryKey: queryKeys.labelsKey(mediaType),
    queryFn: () => fetcher({ url: `/all_labels/${mediaType}` }),
    enabled: isOpen,
});


export const navSearchOptions = (query, page, selector) => queryOptions({
    queryKey: queryKeys.navSearchKey(query, page, selector),
    queryFn: () => fetcher({ url: `/search/${selector}`, queryOrData: { q: query, page } }),
    staleTime: 1000 * 60 * 2,
    enabled: query.length >= 2,
});


export const notificationsCountOptions = () => queryOptions({
    queryKey: queryKeys.notificationCountKey(),
    queryFn: () => fetcher({ url: "/notifications/count" }),
    meta: { errorMessage: "An error occurred fetching the notifications count" },
});


export const notificationsOptions = () => queryOptions({
    queryKey: queryKeys.notificationsKey(),
    queryFn: () => fetcher({ url: "/notifications" }),
    meta: { errorMessage: "An error occurred fetching the notifications" },
    enabled: false,
});


export const filterSearchOptions = (mediaType, username, query, job) => queryOptions({
    queryKey: queryKeys.filterSearchKey(mediaType, username, query, job),
    queryFn: () => {
        return fetcher({
            url: `/list/search/filters/${mediaType}/${username}`,
            queryOrData: { q: query, job },
        });
    },
    staleTime: 1000 * 60 * 2,
    enabled: query.length >= 2,
});


export const achievementOptions = (username) => queryOptions({
    queryKey: queryKeys.achievementPageKey(username),
    queryFn: () => fetcher({ url: `/achievements/${username}` }),
});


export const dailyMediadleOptions = () => queryOptions({
    queryKey: queryKeys.dailyMediadleKey(),
    queryFn: () => fetcher({ url: "/daily-mediadle" }),
});


export const mediadleSuggestionsOptions = (query) => queryOptions({
    queryKey: queryKeys.mediadleSuggestionsKey(query),
    queryFn: () => fetcher({ url: "/daily-mediadle/suggestions", queryOrData: { q: query } }),
    staleTime: 2 * 60 * 1000,
    enabled: query.length >= 2,
});
