import {queryOptions} from "@tanstack/react-query";
import {SearchTypeAdmin} from "@/lib/server/types/base.types";
import {getAdminAchievements, getAdminAllUsers, getAdminJobLogs, getAdminJobs, getAdminMediadleStats, getAdminOverview, getAdminTasks} from "@/lib/server/functions/admin";


export const adminQueryKeys = {
    adminAchievementsKey: () => ["adminAchievements"] as const,
    adminMediadleKey: (search: Record<string, any>) => ["adminMediadle", search] as const,
    adminOverviewKey: () => ["adminOverview"] as const,
    adminTasksKey: () => ["adminTasks"] as const,
    adminUsersKeys: (search: SearchTypeAdmin) => ["adminUpdateUsers", search] as const,
    adminJobsKey: () => ["adminJobs"] as const,
    adminJobLogsKey: (jobId: string | null | undefined) => ["adminJobs", jobId, "Logs"] as const,
    adminJobCompletedKey: () => ["adminJobs", "Completed"] as const,
};


export const userAdminOptions = (search: SearchTypeAdmin) => queryOptions({
    queryKey: adminQueryKeys.adminUsersKeys(search),
    queryFn: () => getAdminAllUsers({ data: search }),
});


export const adminOverviewOptions = () => queryOptions({
    queryKey: adminQueryKeys.adminOverviewKey(),
    queryFn: () => getAdminOverview(),
});


export const adminAchievementsOptions = () => queryOptions({
    queryKey: adminQueryKeys.adminAchievementsKey(),
    queryFn: () => getAdminAchievements(),
});


export const adminMediadleOptions = (search: Record<string, any>) => queryOptions({
    queryKey: adminQueryKeys.adminMediadleKey(search),
    queryFn: () => getAdminMediadleStats({ data: search }),
});


export const adminTasksOptions = () => queryOptions({
    queryKey: adminQueryKeys.adminTasksKey(),
    queryFn: () => getAdminTasks(),
    staleTime: Infinity,
});


export const adminJobsOptions = ({ pollingRateSec }: { pollingRateSec: number }) => queryOptions({
    queryKey: adminQueryKeys.adminJobsKey(),
    queryFn: () => getAdminJobs({ data: { types: ["wait", "active"] } }),
    refetchInterval: pollingRateSec * 1000,
    placeholderData: (previousData) => previousData,
});


export const adminJobLogsOptions = (jobId: string | null | undefined, isEnabled: boolean) => queryOptions({
    queryKey: adminQueryKeys.adminJobLogsKey(jobId),
    queryFn: () => getAdminJobLogs({ data: { jobId: jobId! } }),
    enabled: isEnabled,
});


export const adminJobCompletedOptions = () => queryOptions({
    queryKey: adminQueryKeys.adminJobCompletedKey(),
    queryFn: () => getAdminJobs({ data: { types: ["completed", "failed"] } }),
});
