import {toast} from "sonner";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {adminQueryKeys} from "@/lib/react-query/query-options/admin-options";
import {postAdminUpdateAchievement, postAdminUpdateTiers, postAdminUpdateUser, postTriggerLongTasks} from "@/lib/server/functions/admin";
import {SearchTypeAdmin} from "@/lib/types/zod.schema.types";


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
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postTriggerLongTasks,
        onError: (error) => toast.error(error.message),
        onSuccess: () => {
            // Invalidate `adminJobsKey`, `adminJobLogsKey`, `adminJobCompletedKey` (contain ["admin", "Jobs"] in key definition)
            return queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] });
        },
    });
};
