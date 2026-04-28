import {queryOptions} from "@tanstack/react-query";
import {SearchType} from "@/lib/types/zod.schema.types";
import {MediaRefreshStatsParams} from "@/lib/types/admin.types";
import {
    getAdminAchievements,
    getAdminAllCollections,
    getAdminAllUsers,
    getAdminArchivedTasks,
    getAdminCollectionsOverview,
    getAdminErrorLogs,
    getAdminMediadleStats,
    getAdminMediaOverview,
    getAdminMediaRefreshStats,
    getAdminOverview,
    getAdminTasks,
} from "@/lib/server/functions/admin";


export const userAdminOptions = (search: SearchType) => queryOptions({
    queryKey: ["admin", "updateUsers", search],
    queryFn: () => getAdminAllUsers({ data: search }),
});


export const adminOverviewOptions = queryOptions({
    queryKey: ["admin", "overview"],
    queryFn: () => getAdminOverview(),
});


export const adminMediaOverviewOptions = queryOptions({
    queryKey: ["admin", "media-overview"],
    queryFn: () => getAdminMediaOverview(),
});


export const adminCollectionsOverviewOptions = queryOptions({
    queryKey: ["admin", "collections-overview"],
    queryFn: () => getAdminCollectionsOverview(),
});


export const adminCollectionsOptions = (search: SearchType) => queryOptions({
    queryKey: ["admin", "collections", search],
    queryFn: () => getAdminAllCollections({ data: search }),
});


export const adminAchievementsOptions = queryOptions({
    queryKey: ["admin", "achievements"],
    queryFn: () => getAdminAchievements(),
});


export const adminMediadleOptions = (search: SearchType) => queryOptions({
    queryKey: ["admin", "mediadle", search],
    queryFn: () => getAdminMediadleStats({ data: search }),
});


export const adminTasksOptions = queryOptions({
    queryKey: ["admin", "tasks"],
    queryFn: () => getAdminTasks(),
    staleTime: Infinity,
});


export const adminArchivedTasksOptions = queryOptions({
    queryKey: ["admin", "tasks", "archived"],
    queryFn: getAdminArchivedTasks,
});


export const adminErrorLogsOptions = (search: SearchType) => queryOptions({
    queryKey: ["admin", "errors", search],
    queryFn: () => getAdminErrorLogs({ data: search }),
});


export const adminMediaRefreshOptions = (params: MediaRefreshStatsParams = {}) => queryOptions({
    queryKey: ["admin", "media-refresh", params],
    queryFn: () => getAdminMediaRefreshStats({ data: params }),
});
