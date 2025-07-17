import {toast} from "sonner";
import type {TasksName} from "@/cli/commands";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {adminQueryKeys} from "@/lib/react-query/query-options/admin-options";
import {AchievementTier, AdminUpdatePayload, SearchTypeAdmin} from "@/lib/server/types/base.types";
import {postAdminUpdateAchievement, postAdminUpdateTiers, postAdminUpdateUser, postTriggerLongTasks} from "@/lib/server/functions/admin";


export const useAdminUpdateUserMutation = (filters: SearchTypeAdmin) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, payload }: { userId?: number, payload: AdminUpdatePayload }) => {
            return postAdminUpdateUser({ data: { userId, payload } })
        },
        onError: (error) => toast.error(error.message),
        onSuccess: async (_data, variables, _context) => {
            if (variables.userId && variables.payload.deleteUser) {
                toast.success("User deleted successfully");
            }
            return queryClient.invalidateQueries({ queryKey: adminQueryKeys.adminUsersKeys(filters) })
        },
    });
};


export const useAdminUpdateAchievementMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ achievementId, name, description }: { achievementId: number, name: string, description: string }) => {
            return postAdminUpdateAchievement({ data: { achievementId, name, description } })
        },
        onError: (error) => toast.error(error.message),
        onSuccess: () => {
            return queryClient.invalidateQueries({ queryKey: adminQueryKeys.adminAchievementsKey() })
        },
    });
};


export const useAdminUpdateTiersMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ tiers }: { tiers: AchievementTier[] }) => postAdminUpdateTiers({ data: { tiers } }),
        onError: (error) => toast.error(error.message),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.adminAchievementsKey() }),
    });
};


export const useAdminTriggerTaskMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ taskName }: { taskName: TasksName }) => {
            return postTriggerLongTasks({ data: { taskName } })
        },
        onError: (error) => toast.error(error.message),
        onSuccess: () => {
            // Invalidate `adminJobsKey`, `adminJobLogsKey` queries (contain `adminJobs` in key definition)
            return queryClient.invalidateQueries({ queryKey: ["adminJobs"] });
        },
    });
};
