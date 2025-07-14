import type {TasksName} from "@/cli/commands";
import {SearchTypeAdmin} from "@/lib/server/types/base.types";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {adminQueryKeys} from "@/lib/react-query/query-options/admin-options";
import {postAdminUpdateAchievement, postAdminUpdateTiers, postAdminUpdateUser, postTriggerLongTasks} from "@/lib/server/functions/admin";


export const useAdminUpdateUserMutation = (filters: SearchTypeAdmin) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, payload }: { userId?: number, payload: Record<string, any> }) => {
            return postAdminUpdateUser({ data: { userId, payload } })
        },
        onSuccess: async () => {
            return queryClient.invalidateQueries({ queryKey: adminQueryKeys.adminUsersKeys(filters) })
        },
    });
};


export const useAdminUpdateAchievementMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ achievementId, payload }: { achievementId: number, payload: Record<string, any> }) => {
            return postAdminUpdateAchievement({ data: { achievementId, payload } })
        },
        onSuccess: () => {
            return queryClient.invalidateQueries({ queryKey: adminQueryKeys.adminAchievementsKey() })
        },
    });
};


export const useAdminUpdateTiersMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ payloads }: { payloads: Record<string, any>[] }) => {
            return postAdminUpdateTiers({ data: { payloads } });
        },
        onSuccess: () => {
            return queryClient.invalidateQueries({ queryKey: adminQueryKeys.adminAchievementsKey() })
        },
    });
};


export const useAdminTriggerTaskMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ taskName }: { taskName: TasksName }) => {
            return postTriggerLongTasks({ data: { taskName } })
        },
        onSuccess: () => {
            // Invalidate `adminJobsKey`, `adminJobLogsKey` queries (contain `adminJobs` in key definition)
            return queryClient.invalidateQueries({ queryKey: ["adminJobs"] });
        },
    });
};
