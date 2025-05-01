import {queryOptions} from "@tanstack/react-query";
import {getAdminAchievements, getAdminAllUsers, getAdminJobLogs, getAdminJobs, getAdminMediadleStats, getAdminOverview, getAdminTasks} from "@/lib/server/functions/admin";


type AdminQueryKeyFunction<T extends any[]> = (...args: T) => (string | any)[];


export type AdminQueryKeys = {
    adminUsersKeys: AdminQueryKeyFunction<[Record<string, any>]>;
    adminOverviewKey: AdminQueryKeyFunction<[]>;
    adminAchievementsKey: AdminQueryKeyFunction<[]>;
    adminMediadleKey: AdminQueryKeyFunction<[Record<string, any>]>;
    adminTasksKey: AdminQueryKeyFunction<[]>;
    adminJobsKey: AdminQueryKeyFunction<[]>;
    adminJobLogsKey: AdminQueryKeyFunction<[string | null | undefined]>;
    adminJobCompletedKey: AdminQueryKeyFunction<[]>;
};


export const adminQueryKeys: AdminQueryKeys = {
    adminAchievementsKey: () => ["adminAchievements"],
    adminMediadleKey: (search) => ["adminMediadle", search],
    adminOverviewKey: () => ["adminOverview"],
    adminTasksKey: () => ["adminTasks"],
    adminUsersKeys: (search) => ["adminUpdateUsers", search],
    adminJobsKey: () => ["adminJobs"],
    adminJobLogsKey: (jobId) => ["adminJobs", jobId, "Logs"],
    adminJobCompletedKey: () => ["adminJobs", "Completed"],
};


export const userAdminOptions = (search: Record<string, any>) => queryOptions({
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
