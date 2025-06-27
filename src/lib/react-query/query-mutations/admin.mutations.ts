import type {TasksName} from "@/cli/commands";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {adminQueryKeys} from "@/lib/react-query/query-options/admin-options";
import {postAdminUpdateAchievement, postAdminUpdateTiers, postAdminUpdateUser, postTriggerLongTasks} from "@/lib/server/functions/admin";


export const useAdminUpdateUserMutation = (queryKey: string[]) => {
    const queryClient = useQueryClient();

    return useMutation<any, Error, { userId: number | undefined, payload: Record<string, any> }>({
        mutationFn: ({ userId, payload }) => postAdminUpdateUser({ data: { userId, payload } }),
        onSuccess: async () => await queryClient.invalidateQueries({ queryKey }),
    });
};


export const useAdminUpdateAchievementMutation = () => {
    const queryClient = useQueryClient();

    return useMutation<any, Error, { achievementId: number, payload: Record<string, any> }>({
        mutationFn: ({ achievementId, payload }) => postAdminUpdateAchievement({ data: { achievementId, payload } }),
        onSuccess: async () => await queryClient.invalidateQueries({ queryKey: adminQueryKeys.adminAchievementsKey() }),
    });
};


export const useAdminUpdateTiersMutation = () => {
    const queryClient = useQueryClient();

    return useMutation<any, Error, { payloads: Record<string, any>[] }>({
        mutationFn: ({ payloads }) => postAdminUpdateTiers({ data: { payloads } }),
        onSuccess: async () => {
            return queryClient.invalidateQueries({ queryKey: adminQueryKeys.adminAchievementsKey() })
        },
    });
};


export const useAdminTriggerTaskMutation = () => {
    const queryClient = useQueryClient();

    return useMutation<any, Error, { taskName: TasksName }>({
        mutationFn: ({ taskName }) => postTriggerLongTasks({ data: { taskName } }),
        onSuccess: async () => {
            // Invalidate adminJobsKey, adminJobLogsKey queries (contain "adminJobs" in key definition)
            await queryClient.invalidateQueries({ queryKey: ["adminJobs"] });
        },
    });
};
