import {queryOptions} from "@tanstack/react-query";
import {SearchType, SearchTypeAdmin} from "@/lib/types/zod.schema.types";
import {
    getAdminAchievements,
    getAdminAllUsers,
    getAdminJobLogs,
    getAdminJobs,
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
    adminJobsKey: () => ["admin", "jobs"] as const,
    adminJobLogsKey: (jobId: string | null | undefined) => ["admin", "jobs", jobId, "Logs"] as const,
    adminJobCompletedKey: () => ["admin", "jobs", "Completed"] as const,
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


export const adminJobsOptions = (pollingRateSec: number = 5) => queryOptions({
    queryKey: adminQueryKeys.adminJobsKey(),
    queryFn: () => getAdminJobs({ data: { types: ["wait", "active"] } }),
    meta: { displayErrorMsg: true },
    refetchInterval: pollingRateSec * 1000,
    placeholderData: (previousData) => previousData,
});


export const adminJobLogsOptions = (jobId: string | null | undefined, isEnabled: boolean) => queryOptions({
    queryKey: adminQueryKeys.adminJobLogsKey(jobId),
    queryFn: () => getAdminJobLogs({ data: { jobId: jobId! } }),
    meta: { displayErrorMsg: true },
    enabled: isEnabled,
});


export const adminJobCompletedOptions = () => queryOptions({
    queryKey: adminQueryKeys.adminJobCompletedKey(),
    queryFn: () => getAdminJobs({ data: { types: ["completed", "failed"] } }),
    meta: { displayErrorMsg: true },
});
