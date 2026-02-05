import {queryOptions} from "@tanstack/react-query";
import {SearchType} from "@/lib/types/zod.schema.types";
import {
    getAdminAchievements,
    getAdminAllUsers,
    getAdminArchivedTasks,
    getAdminErrorLogs,
    getAdminMediadleStats,
    getAdminMediaOverview,
    getAdminOverview,
    getAdminTasks,
    getAdminUserTracking,
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


export const adminUserTracking = (userId: number) => queryOptions({
    queryKey: ["admin", "tracking", userId],
    queryFn: () => getAdminUserTracking({ data: { userId } }),
    staleTime: 60 * 1000,
});
