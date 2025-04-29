import {queryOptions} from "@tanstack/react-query";
import {getAdminAchievements, getAdminAllUsers, getAdminMediadleStats, getAdminOverview} from "@/lib/server/functions/admin";


type AdminQueryKeyFunction<T extends any[]> = (...args: T) => (string | any)[];


export type AdminQueryKeys = {
    adminUsersKeys: AdminQueryKeyFunction<[Record<string, any>]>;
    adminOverviewKey: AdminQueryKeyFunction<[]>;
    adminAchievementsKey: AdminQueryKeyFunction<[]>;
    adminMediadleKey: AdminQueryKeyFunction<[Record<string, any>]>;
    adminTasksKey: AdminQueryKeyFunction<[]>;
};


export const adminQueryKeys: AdminQueryKeys = {
    adminAchievementsKey: () => ["adminAchievements"],
    adminMediadleKey: (search) => ["adminMediadle", search],
    adminOverviewKey: () => ["adminOverview"],
    adminTasksKey: () => ["adminTags"],
    adminUsersKeys: (search) => ["adminUpdateUsers", search],
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
    // queryFn: () => getAdminTasks(),
});
