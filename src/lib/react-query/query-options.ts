import {queryOptions} from "@tanstack/react-query";
import {getCurrentUser} from "@/lib/server/functions/user";


type Page = number;
type Query = string;
type JobType = string;
type Username = string;
type Selector = string;
type MediaId = string | number;
type Search = Record<string, any>;
type Filters = Record<string, any>;
type MediaType = "series" | "anime" | "movies" | "games" | "books" | "manga";


type QueryKeyFunction<T extends any[]> = (...args: T) => (string | any)[];


type QueryKeys = {
    achievementPageKey: QueryKeyFunction<[Username]>;
    authKey: QueryKeyFunction<[]>;
    allUpdatesKey: QueryKeyFunction<[Username, Filters]>;
    dailyMediadleKey: QueryKeyFunction<[]>;
    detailsKey: QueryKeyFunction<[MediaType, MediaId]>;
    editDetailsKey: QueryKeyFunction<[MediaType, MediaId]>;
    filterSearchKey: QueryKeyFunction<[MediaType, Username, Query, JobType]>;
    followersKey: QueryKeyFunction<[Username]>;
    followsKey: QueryKeyFunction<[Username]>;
    globalStatsKey: QueryKeyFunction<[Search]>;
    historyKey: QueryKeyFunction<[MediaType, MediaId]>;
    hofKey: QueryKeyFunction<[Search]>;
    jobDetailsKey: QueryKeyFunction<[MediaType, JobType, string, Search]>;
    labelsKey: QueryKeyFunction<[MediaType]>;
    navSearchKey: QueryKeyFunction<[Query, Page, Selector]>;
    notificationCountKey: QueryKeyFunction<[]>;
    notificationsKey: QueryKeyFunction<[]>;
    mediadleSuggestionsKey: QueryKeyFunction<[Query]>;
    profileKey: QueryKeyFunction<[Username]>;
    smallFiltersKey: QueryKeyFunction<[MediaType, Username]>;
    statsKey: QueryKeyFunction<[Username, Search]>;
    trendsKey: QueryKeyFunction<[]>;
    upcomingKey: QueryKeyFunction<[]>;
    userListKey: QueryKeyFunction<[MediaType, Username, Search]>;
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
    smallFiltersKey: (mediaType, username) => ["smallFilters", mediaType, username],
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
