import {fetcher} from "@/api/fetcher";
import {queryOptions} from "@tanstack/react-query";


export const queryOptionsMap = {
    details: (mediaType, mediaId, external) => queryOptions({
        queryKey: ["details", mediaType, mediaId],
        queryFn: () => fetcher({url: `/details/${mediaType}/${mediaId}`, queryOrData: external}),
        staleTime: 2 * 1000,
    }),
    profile: (username) => queryOptions({
        queryKey: ["profile", username],
        queryFn: () => fetcher({url: `/profile/${username}`}),
    }),
    history: (username, filters) => queryOptions({
        queryKey: ["history", username, filters],
        queryFn: () => fetcher({url: `/profile/${username}/history`, queryOrData: filters}),
    }),
    borders: () => queryOptions({
        queryKey: ["borders"],
        queryFn: () => fetcher({url: "/levels/profile_borders"}),
    }),
    trends: () => queryOptions({
        queryKey: ["trends"],
        queryFn: () => fetcher({url: "/current_trends"}),
    }),
    upcoming: () => queryOptions({
        queryKey: ["upcoming"],
        queryFn: () => fetcher({url: "/coming_next"}),
    }),
    globalStats: () => queryOptions({
        queryKey: ["globalStats"],
        queryFn: () => fetcher({url: "/mylists_stats"}),
    }),
    jobDetails: (mediaType, job, name) => queryOptions({
        queryKey: ["jobDetails", mediaType, job, name],
        queryFn: () => fetcher({url: `/details/${mediaType}/${job}/${name}`}),
    }),
    editMedia: (mediaType, mediaId) => queryOptions({
        queryKey: ["editDetails", mediaType, mediaId],
        queryFn: () => fetcher({url: `/details/edit/${mediaType}/${mediaId}`}),
    }),
    list: (mediaType, username, search) => queryOptions({
        queryKey: ["userList", mediaType, username, search],
        queryFn: () => fetcher({url: `/list/${mediaType}/${username}`, queryOrData: search}),
        enabled: false,
        staleTime: Infinity,
    }),
    followers: (username) => queryOptions({
        queryKey: ["followers", username],
        queryFn: () => fetcher({url: `/profile/${username}/followers`}),
    }),
    follows: (username) => queryOptions({
        queryKey: ["follows", username],
        queryFn: () => fetcher({url: `/profile/${username}/follows`}),
    }),
    stats: (mediaType, username) => queryOptions({
        queryKey: ["stats", mediaType, username],
        queryFn: () => fetcher({url: `/stats/${mediaType}/${username}`}),
    }),
    hallOfFame: (search) => queryOptions({
        queryKey: ["hof", search],
        queryFn: () => fetcher({url: "/hall_of_fame", queryOrData: search}),
    }),
    smallFilters: (mediaType, username) => queryOptions({
        queryKey: ["smallFilters", mediaType, username],
        queryFn: () => fetcher({url: `/list/filters/${mediaType}/${username}`}),
        staleTime: Infinity,
    }),
    mediaLabels: (mediaType, mediaId, isOpen) => queryOptions({
        queryKey: ["labels", mediaType, mediaId],
        queryFn: () => fetcher({url: `/labels_for_media/${mediaType}/${mediaId}`}),
        enabled: isOpen,
    }),
    navSearch: (query, page, selector) => queryOptions({
        queryKey: ["navSearch", query, page, selector],
        queryFn: () => fetcher({
            url: "/autocomplete",
            queryOrData: {q: query, page, selector}
        }),
        staleTime: 1000 * 60 * 2,
        enabled: query.length >= 2,
    }),
    notificationsCount: () => queryOptions({
        queryKey: ["notificationCount"],
        queryFn: () => fetcher({url: "/notifications/count"}),
        meta: {errorMessage: "An error occurred fetching the notifications count"},
    }),
    notifications: () => queryOptions({
        queryKey: ["notifications"],
        queryFn: () => fetcher({url: "/notifications"}),
        meta: {errorMessage: "An error occurred fetching the notifications"},
        enabled: false,
    }),
    filterSearch: (mediaType, username, query, job) => queryOptions({
        queryKey: ["filterSearch", mediaType, username, query, job],
        queryFn: () => {
            return fetcher({
                url: `/list/search/filters/${mediaType}/${username}`,
                queryOrData: {q: query, job},
            })
        },
        staleTime: 1000 * 60 * 2,
        enabled: query.length >= 2,
    }),
};
