import {toast} from "sonner";
import {SearchTypeAdmin} from "@/lib/types/zod.schema.types";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {adminArchivedTasksOptions, adminQueryKeys} from "@/lib/client/react-query/query-options/admin-options";
import {postAdminDeleteArchivedTask, postAdminTriggerTask, postAdminUpdateAchievement, postAdminUpdateTiers, postAdminUpdateUser} from "@/lib/server/functions/admin";


export const useAdminUpdateUserMutation = (filters: SearchTypeAdmin) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postAdminUpdateUser,
        onError: (error) => toast.error(error.message),
        onSuccess: async (_data, variables, _context) => {
            if (variables.data.userId && variables.data.payload.deleteUser) {
                toast.success("User deleted successfully");
            }
            return queryClient.invalidateQueries({ queryKey: adminQueryKeys.adminUsersKeys(filters) })
        },
    });
};


export const useAdminUpdateAchievementMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postAdminUpdateAchievement,
        onError: (error) => toast.error(error.message),
        onSuccess: () => {
            return queryClient.invalidateQueries({ queryKey: adminQueryKeys.adminAchievementsKey() })
        },
    });
};


export const useAdminUpdateTiersMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postAdminUpdateTiers,
        onError: (error) => toast.error(error.message),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.adminAchievementsKey() }),
    });
};


export const useAdminTriggerTaskMutation = () => {
    return useMutation({
        mutationFn: postAdminTriggerTask,
        onError: (error) => toast.error(error.message),
    });
};


export const useAdminDeleteTaskMutation = () => {
    return useMutation({
        mutationFn: postAdminDeleteArchivedTask,
        onError: (error) => toast.error(error.message ?? "Can't delete this task."),
        onSuccess: async (_data, _variables, _result, context) => {
            await context.client.invalidateQueries({ queryKey: adminArchivedTasksOptions().queryKey });
        },
    });
};
