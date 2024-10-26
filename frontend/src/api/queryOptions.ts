import {api} from "@/api/apiClient";
import {fetcher} from "@/api/fetcher";
import {queryOptions} from "@tanstack/react-query";
import {MediaType, SearchSelector} from "@/utils/types.tsx";


export const historyOptions = (mediaType: MediaType, mediaId: number) => queryOptions({
    queryKey: ["onOpenHistory", mediaType, mediaId],
    queryFn: () => fetcher({url: `/history/${mediaType}/${mediaId}`}),
    staleTime: 10 * 1000,
    placeholderData: [],
});


export const detailsOptions = (mediaType: MediaType, mediaId: number, external: boolean) => queryOptions({
    queryKey: ["details", mediaType, mediaId],
    queryFn: () => fetcher({url: `/details/${mediaType}/${mediaId}`, queryOrData: {external}}),
    staleTime: 2 * 1000,
});


export const profileOptions = (username: string) => queryOptions({
    queryKey: ["profile", username],
    queryFn: () => fetcher({url: `/profile/${username}`}),
});


export const allUpdatesOptions = (username: string, filters?: Record<string, any>) => queryOptions({
    queryKey: ["allUpdates", username, filters],
    queryFn: () => fetcher({url: `/profile/${username}/history`, queryOrData: filters}),
});


export const jobDetailsOptions = (mediaType: MediaType, job: string, name: string) => queryOptions({
    queryKey: ["jobDetails", mediaType, job, name],
    queryFn: () => fetcher({url: `/details/${mediaType}/${job}/${name}`}),
});


export const editMediaOptions = (mediaType: MediaType, mediaId: number) => queryOptions({
    queryKey: ["editDetails", mediaType, mediaId],
    queryFn: () => fetcher({url: `/details/edit/${mediaType}/${mediaId}`}),
    gcTime: 0,
    staleTime: 0,
});


export const listOptions = (mediaType: MediaType, username: string, search?: Record<string, any>) => queryOptions({
    queryKey: ["userList", mediaType, username, search],
    queryFn: () => fetcher({url: `/list/${mediaType}/${username}`, queryOrData: search}),
});


export const followersOptions = (username: string) => queryOptions({
    queryKey: ["followers", username],
    queryFn: () => fetcher({url: `/profile/${username}/followers`}),
});


export const followsOptions = (username: string) => queryOptions({
    queryKey: ["follows", username],
    queryFn: () => fetcher({url: `/profile/${username}/follows`}),
});


export const statsOptions = (mediaType: MediaType, username: string) => queryOptions({
    queryKey: ["stats", mediaType, username],
    queryFn: () => fetcher({url: `/stats/${mediaType}/${username}`}),
});


export const hallOfFameOptions = (search?: Record<string, any>) => queryOptions({
    queryKey: ["hof", search],
    queryFn: () => fetcher({url: "/hall_of_fame", queryOrData: search}),
});


export const smallFiltersOptions = (mediaType: MediaType, username: string) => queryOptions({
    queryKey: ["smallFilters", mediaType, username],
    queryFn: () => fetcher({url: `/list/filters/${mediaType}/${username}`}),
    staleTime: Infinity,
});


export const mediaLabelsOptions = (mediaType: MediaType, isOpen: boolean) => queryOptions({
    queryKey: ["labels", mediaType],
    queryFn: () => fetcher({url: `/all_labels/${mediaType}`}),
    enabled: isOpen,
});


export const navSearchOptions = (query: string, page: number, selector: SearchSelector) => queryOptions({
    queryKey: ["navSearch", query, page, selector],
    queryFn: () => fetcher({url: `/search/${selector}`, queryOrData: {q: query, page}}),
    staleTime: 1000 * 60 * 2,
    enabled: query.length >= 2,
});


export const filterSearchOptions = (mediaType: MediaType, username: string, query: string, job: string) => queryOptions({
    queryKey: ["filterSearch", mediaType, username, query, job],
    queryFn: () => fetcher({url: `/list/search/filters/${mediaType}/${username}`, queryOrData: {q: query, job}}),
    staleTime: 1000 * 60 * 2,
    enabled: query.length >= 2,
});


export const achievementOptions = (username: string) => queryOptions({
    queryKey: ["achievementPage", username],
    queryFn: () => fetcher({url: `/achievements/${username}`}),
});


export const authOptions = () => queryOptions({
    queryKey: ["currentUser"],
    queryFn: () => api.fetchCurrentUser(),
    staleTime: Infinity,
});


export const bordersOptions = () => queryOptions({
    queryKey: ["borders"],
    queryFn: () => fetcher({url: "/levels/profile_borders"}),
});


export const trendsOptions = () => queryOptions({
    queryKey: ["trends"],
    queryFn: () => fetcher({url: "/current_trends"}),
    meta: {errorMessage: "An error occurred fetching the trends. Please try again later."},
});


export const upcomingOptions = () => queryOptions({
    queryKey: ["upcoming"],
    queryFn: () => fetcher({url: "/coming_next"}),
});


export const globalStatsOptions = () => queryOptions({
    queryKey: ["globalStats"],
    queryFn: () => fetcher({url: "/mylists_stats"}),
});


export const notificationsCountOptions = () => queryOptions({
    queryKey: ["notificationCount"],
    queryFn: () => fetcher({url: "/notifications/count"}),
    meta: {errorMessage: "An error occurred fetching the notifications count"},
});


export const notificationsOptions = () => queryOptions({
    queryKey: ["notifications"],
    queryFn: () => fetcher({url: "/notifications"}),
    meta: {errorMessage: "An error occurred fetching the notifications"},
    enabled: false,
});