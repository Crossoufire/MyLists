import {fetcher} from "./utils";
import {getApiClient} from "./apiClient";
import {queryOptions} from "@tanstack/react-query";


export const queryKeys = {
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
    jobDetailsKey: (mediaType, job, name) => ["jobDetails", mediaType, job, name],
    labelsKey: (mediaType) => ["labels", mediaType],
    navSearchKey: (query, page, selector) => ["navSearch", query, page, selector],
    notificationCountKey: () => ["notificationCount"],
    notificationsKey: () => ["notifications"],
    mediadleSuggestionsKey: (query) => ["mediadleSuggestions", query],
    profileKey: (username) => ["profile", username],
    smallFiltersKey: (mediaType, username) => ["smallFilters", mediaType, username],
    statsKey: (username, search) => ["stats", username, search],
    trendsKey: () => ["trends"],
    upcomingKey: () => ["upcoming"],
    userListKey: (mediaType, username, search) => ["userList", mediaType, username, search],
};


const queryUrls = {
    /* Auth/User Endpoints */
    profile: (username) => `/profile/${username}`,
    allUpdates: (username) => `/profile/${username}/history`,
    achievements: (username) => `/achievements/${username}`,
    followers: (username) => `/profile/${username}/followers`,
    follows: (username) => `/profile/${username}/follows`,

    /* Media Endpoints */
    history: (mediaType, mediaId) => `/history/${mediaType}/${mediaId}`,
    details: (mediaType, mediaId) => `/details/${mediaType}/${mediaId}`,
    editDetails: (mediaType, mediaId) => `/details/edit/${mediaType}/${mediaId}`,
    labels: (mediaType) => `/all_labels/${mediaType}`,
    smallFilters: (mediaType, username) => `/list/filters/${mediaType}/${username}`,
    userList: (mediaType, username) => `/list/${mediaType}/${username}`,

    /* Stats/Misc Endpoints */
    globalStats: () => "/mylists_stats",
    jobDetails: (mediaType, job, name) => `/details/${mediaType}/${job}/${name}`,
    stats: (username) => `/stats/${username}`,
    trends: () => "/current_trends",
    upcoming: () => "/coming_next",
    hof: () => "/hall_of_fame",

    /* Moviedle Endpoints */
    dailyMediadle: () => "/daily-mediadle",
    mediadleSuggestions: () => "/daily-mediadle/suggestions",

    /* Search/Notifications Endpoints */
    navSearch: (selector) => `/search/${selector}`,
    filterSearch: (mediaType, username) => `/list/search/filters/${mediaType}/${username}`,
    notificationCount: () => "/notifications/count",
    notifications: () => "/notifications",
};


export const authOptions = () => queryOptions({
    queryKey: queryKeys.authKey(),
    queryFn: () => getApiClient().fetchCurrentUser(),
    staleTime: Infinity,
});


export const profileOptions = (username) => queryOptions({
    queryKey: queryKeys.profileKey(username),
    queryFn: () => fetcher({ url: queryUrls.profile(username) }),
});


export const followersOptions = (username) => queryOptions({
    queryKey: queryKeys.followersKey(username),
    queryFn: () => fetcher({ url: queryUrls.followers(username) }),
});


export const followsOptions = (username) => queryOptions({
    queryKey: queryKeys.followsKey(username),
    queryFn: () => fetcher({ url: queryUrls.follows(username) }),
});


export const allUpdatesOptions = (username, filters) => queryOptions({
    queryKey: queryKeys.allUpdatesKey(username, filters),
    queryFn: () => fetcher({ url: queryUrls.allUpdates(username), queryOrData: filters }),
});


export const achievementOptions = (username) => queryOptions({
    queryKey: queryKeys.achievementPageKey(username),
    queryFn: () => fetcher({ url: queryUrls.achievements(username) }),
});


export const historyOptions = (mediaType, mediaId) => queryOptions({
    queryKey: queryKeys.historyKey(mediaType, mediaId),
    queryFn: () => fetcher({ url: queryUrls.history(mediaType, mediaId) }),
    staleTime: 10 * 1000,
    placeholderData: [],
});


export const detailsOptions = (mediaType, mediaId, external) => queryOptions({
    queryKey: queryKeys.detailsKey(mediaType, mediaId),
    queryFn: () => fetcher({
        url: queryUrls.details(mediaType, mediaId),
        queryOrData: { external },
    }),
    staleTime: 2 * 1000,
});


export const editMediaOptions = (mediaType, mediaId) => queryOptions({
    queryKey: queryKeys.editDetailsKey(mediaType, mediaId),
    queryFn: () => fetcher({ url: queryUrls.editDetails(mediaType, mediaId) }),
    gcTime: 0,
    staleTime: 0,
});


export const mediaLabelsOptions = (mediaType, isOpen) => queryOptions({
    queryKey: queryKeys.labelsKey(mediaType),
    queryFn: () => fetcher({ url: queryUrls.labels(mediaType) }),
    enabled: isOpen,
});


export const listOptions = (mediaType, username, search) => queryOptions({
    queryKey: queryKeys.userListKey(mediaType, username, search),
    queryFn: () => fetcher({ url: queryUrls.userList(mediaType, username), queryOrData: search }),
});


export const smallFiltersOptions = (mediaType, username) => queryOptions({
    queryKey: queryKeys.smallFiltersKey(mediaType, username),
    queryFn: () => fetcher({ url: queryUrls.smallFilters(mediaType, username) }),
    staleTime: Infinity,
});


export const globalStatsOptions = (search) => queryOptions({
    queryKey: queryKeys.globalStatsKey(search),
    queryFn: () => fetcher({ url: queryUrls.globalStats(), queryOrData: search }),
});


export const jobDetailsOptions = (mediaType, job, name) => queryOptions({
    queryKey: queryKeys.jobDetailsKey(mediaType, job, name),
    queryFn: () => fetcher({ url: queryUrls.jobDetails(mediaType, job, name) }),
});


export const statsOptions = (username, search) => queryOptions({
    queryKey: queryKeys.statsKey(username, search),
    queryFn: () => fetcher({ url: queryUrls.stats(username), queryOrData: search }),
});


export const trendsOptions = () => queryOptions({
    queryKey: queryKeys.trendsKey(),
    queryFn: () => fetcher({ url: queryUrls.trends() }),
    meta: { errorMessage: "An error occurred fetching the trends. Please try again later." },
});


export const upcomingOptions = () => queryOptions({
    queryKey: queryKeys.upcomingKey(),
    queryFn: () => fetcher({ url: queryUrls.upcoming() }),
});


export const hallOfFameOptions = (search) => queryOptions({
    queryKey: queryKeys.hofKey(search),
    queryFn: () => fetcher({ url: queryUrls.hof(), queryOrData: search }),
});


export const dailyMediadleOptions = () => queryOptions({
    queryKey: queryKeys.dailyMediadleKey(),
    queryFn: () => fetcher({ url: queryUrls.dailyMediadle() }),
});


export const mediadleSuggestionsOptions = (query) => queryOptions({
    queryKey: queryKeys.mediadleSuggestionsKey(query),
    queryFn: () => fetcher({ url: queryUrls.mediadleSuggestions(), queryOrData: { q: query } }),
    staleTime: 2 * 60 * 1000,
    enabled: query.length >= 2,
});


export const navSearchOptions = (query, page, selector) => queryOptions({
    queryKey: queryKeys.navSearchKey(query, page, selector),
    queryFn: () => fetcher({ url: queryUrls.navSearch(selector), queryOrData: { q: query, page } }),
    staleTime: 1000 * 60 * 2,
    enabled: query.length >= 2,
});


export const filterSearchOptions = (mediaType, username, query, job) => queryOptions({
    queryKey: queryKeys.filterSearchKey(mediaType, username, query, job),
    queryFn: () => fetcher({
        url: queryUrls.filterSearch(mediaType, username),
        queryOrData: { q: query, job },
    }),
    staleTime: 1000 * 60 * 2,
    enabled: query.length >= 2,
});


export const notificationsCountOptions = () => queryOptions({
    queryKey: queryKeys.notificationCountKey(),
    queryFn: () => fetcher({ url: queryUrls.notificationCount() }),
    meta: { errorMessage: "An error occurred fetching the notifications count" },
});


export const notificationsOptions = () => queryOptions({
    queryKey: queryKeys.notificationsKey(),
    queryFn: () => fetcher({ url: queryUrls.notifications() }),
    meta: { errorMessage: "An error occurred fetching the notifications" },
    enabled: false,
});
