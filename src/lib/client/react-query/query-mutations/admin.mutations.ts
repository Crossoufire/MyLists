import {toast} from "sonner";
import {SearchTypeAdmin} from "@/lib/types/zod.schema.types";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {adminAchievementsOptions, adminArchivedTasksOptions, adminErrorLogsOptions, userAdminOptions} from "@/lib/client/react-query/query-options/admin-options";
import {
    postAdminDeleteArchivedTask,
    postAdminDeleteErrorLog,
    postAdminTriggerTask,
    postAdminUpdateAchievement,
    postAdminUpdateTiers,
    postAdminUpdateUser
} from "@/lib/server/functions/admin";


export const useAdminUpdateUserMutation = (filters: SearchTypeAdmin) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postAdminUpdateUser,
        onError: (error) => toast.error(error.message),
        onSuccess: async (_data, variables) => {
            if (variables.data.userId && variables.data.payload.deleteUser) {
                toast.success("User deleted successfully");
            }
            return queryClient.invalidateQueries({ queryKey: userAdminOptions(filters).queryKey })
        },
    });
};


export const useAdminUpdateAchievementMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postAdminUpdateAchievement,
        onError: (error) => toast.error(error.message),
        onSuccess: () => {
            return queryClient.invalidateQueries({ queryKey: adminAchievementsOptions.queryKey })
        },
    });
};


export const useAdminUpdateTiersMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postAdminUpdateTiers,
        onError: (error) => toast.error(error.message),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: adminAchievementsOptions.queryKey }),
    });
};


export const useAdminTriggerTaskMutation = () => {
    return useMutation({ mutationFn: postAdminTriggerTask });
};


export const useAdminDeleteTaskMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postAdminDeleteArchivedTask,
        onError: (error) => toast.error(error.message ?? "Can't delete this task."),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: adminArchivedTasksOptions.queryKey });
        },
    });
};


export const useAdminDeleteErrorLogsMutation = (search: SearchTypeAdmin) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postAdminDeleteErrorLog,
        onError: (error) => toast.error(error.message ?? "Can't delete some error logs."),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: adminErrorLogsOptions(search).queryKey });
        },
    });
};
