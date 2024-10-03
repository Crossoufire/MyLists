import {fetcher} from "@/api/fetcher";
import {queryOptions} from "@tanstack/react-query";
import {api} from "@/api/apiClient";


export const authOptions = () => queryOptions({
    queryKey: ["currentUser"],
    queryFn: () => api.fetchCurrentUser(),
    staleTime: Infinity,
});

export const detailsOptions = (mediaType, mediaId, external) => queryOptions({
    queryKey: ["details", mediaType, mediaId],
    queryFn: () => fetcher({ url: `/details/${mediaType}/${mediaId}`, queryOrData: { external } }),
    staleTime: 2 * 1000,
});

export const profileOptions = (username) => queryOptions({
    queryKey: ["profile", username],
    queryFn: () => fetcher({ url: `/profile/${username}` }),
});

export const historyOptions = (username, filters) => queryOptions({
    queryKey: ["history", username, filters],
    queryFn: () => fetcher({ url: `/profile/${username}/history`, queryOrData: filters }),
});

export const bordersOptions = () => queryOptions({
    queryKey: ["borders"],
    queryFn: () => fetcher({ url: "/levels/profile_borders" }),
});

export const trendsOptions = () => queryOptions({
    queryKey: ["trends"],
    queryFn: () => fetcher({ url: "/current_trends" }),
    meta: { errorMessage: "An error occurred fetching the trends. Please try again later." },
});

export const upcomingOptions = () => queryOptions({
    queryKey: ["upcoming"],
    queryFn: () => fetcher({ url: "/coming_next" }),
});

export const globalStatsOptions = () => queryOptions({
    queryKey: ["globalStats"],
    queryFn: () => fetcher({ url: "/mylists_stats" }),
});

export const jobDetailsOptions = (mediaType, job, name) => queryOptions({
    queryKey: ["jobDetails", mediaType, job, name],
    queryFn: () => fetcher({ url: `/details/${mediaType}/${job}/${name}` }),
});

export const editMediaOptions = (mediaType, mediaId) => queryOptions({
    queryKey: ["editDetails", mediaType, mediaId],
    queryFn: () => fetcher({ url: `/details/edit/${mediaType}/${mediaId}` }),
    gcTime: 0,
    staleTime: 0,
});

export const listOptions = (mediaType, username, search) => queryOptions({
    queryKey: ["userList", mediaType, username, search],
    queryFn: () => fetcher({ url: `/list/${mediaType}/${username}`, queryOrData: search }),
});

export const followersOptions = (username) => queryOptions({
    queryKey: ["followers", username],
    queryFn: () => fetcher({ url: `/profile/${username}/followers` }),
});

export const followsOptions = (username) => queryOptions({
    queryKey: ["follows", username],
    queryFn: () => fetcher({ url: `/profile/${username}/follows` }),
});

export const statsOptions = (mediaType, username) => queryOptions({
    queryKey: ["stats", mediaType, username],
    queryFn: () => fetcher({ url: `/stats/${mediaType}/${username}` }),
});

export const hallOfFameOptions = (search) => queryOptions({
    queryKey: ["hof", search],
    queryFn: () => fetcher({ url: "/hall_of_fame", queryOrData: search }),
});

export const smallFiltersOptions = (mediaType, username) => queryOptions({
    queryKey: ["smallFilters", mediaType, username],
    queryFn: () => fetcher({ url: `/list/filters/${mediaType}/${username}` }),
    staleTime: Infinity,
});

export const mediaLabelsOptions = (mediaType, isOpen) => queryOptions({
    queryKey: ["labels", mediaType],
    queryFn: () => fetcher({ url: `/all_labels/${mediaType}` }),
    enabled: isOpen,
});

export const navSearchOptions = (query, page, selector) => queryOptions({
    queryKey: ["navSearch", query, page, selector],
    queryFn: () => fetcher({ url: `/search/${selector}`, queryOrData: { q: query, page } }),
    staleTime: 1000 * 60 * 2,
    enabled: query.length >= 2,
});

export const notificationsCountOptions = () => queryOptions({
    queryKey: ["notificationCount"],
    queryFn: () => fetcher({ url: "/notifications/count" }),
    meta: { errorMessage: "An error occurred fetching the notifications count" },
});

export const notificationsOptions = () => queryOptions({
    queryKey: ["notifications"],
    queryFn: () => fetcher({ url: "/notifications" }),
    meta: { errorMessage: "An error occurred fetching the notifications" },
    enabled: false,
});

export const filterSearchOptions = (mediaType, username, query, job) => queryOptions({
    queryKey: ["filterSearch", mediaType, username, query, job],
    queryFn: () => {
        return fetcher({
            url: `/list/search/filters/${mediaType}/${username}`,
            queryOrData: { q: query, job },
        });
    },
    staleTime: 1000 * 60 * 2,
    enabled: query.length >= 2,
});
