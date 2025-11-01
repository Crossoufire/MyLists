import {queryOptions} from "@tanstack/react-query";
import {SearchType, SearchTypeAdmin} from "@/lib/types/zod.schema.types";
import {
    getAdminAchievements,
    getAdminAllUsers,
    getAdminArchivedTasks,
    getAdminMediadleStats,
    getAdminMediaOverview,
    getAdminOverview,
    getAdminTasks
} from "@/lib/server/functions/admin";


export const adminQueryKeys = {
    adminAchievementsKey: () => ["admin", "achievements"] as const,
    adminMediadleKey: (search: SearchType) => ["admin", "mediadle", search] as const,
    adminOverviewKey: () => ["admin", "overview"] as const,
    adminMediaOverviewKey: () => ["admin", "media-overview"] as const,
    adminTasksKey: () => ["admin", "tasks"] as const,
    adminUsersKeys: (search: SearchTypeAdmin) => ["admin", "updateUsers", search] as const,
    adminCheckActiveJobs: () => ["admin", "jobs", "active"] as const,
    adminJobLogsKey: (jobId: string | null | undefined) => ["admin", "jobs", jobId, "Logs"] as const,
    adminJobArchivedKey: () => ["admin", "jobs", "archived"] as const,
};


export const userAdminOptions = (search: SearchTypeAdmin) => queryOptions({
    queryKey: adminQueryKeys.adminUsersKeys(search),
    queryFn: () => getAdminAllUsers({ data: search }),
});


export const adminOverviewOptions = () => queryOptions({
    queryKey: adminQueryKeys.adminOverviewKey(),
    queryFn: () => getAdminOverview(),
});


export const adminMediaOverviewOptions = () => queryOptions({
    queryKey: adminQueryKeys.adminMediaOverviewKey(),
    queryFn: () => getAdminMediaOverview(),
});


export const adminAchievementsOptions = () => queryOptions({
    queryKey: adminQueryKeys.adminAchievementsKey(),
    queryFn: () => getAdminAchievements(),
});


export const adminMediadleOptions = (search: SearchType) => queryOptions({
    queryKey: adminQueryKeys.adminMediadleKey(search),
    queryFn: () => getAdminMediadleStats({ data: search }),
});


export const adminTasksOptions = () => queryOptions({
    queryKey: adminQueryKeys.adminTasksKey(),
    queryFn: () => getAdminTasks(),
    staleTime: Infinity,
});


export const adminArchivedTasksOptions = () => queryOptions({
    queryKey: adminQueryKeys.adminJobArchivedKey(),
    queryFn: getAdminArchivedTasks,
    meta: { displayErrorMsg: true },
});
