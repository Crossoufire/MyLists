import {useMutation, useQueryClient} from "@tanstack/react-query";
import {postAdminUpdateAchievement, postAdminUpdateTiers, postAdminUpdateUser} from "@/lib/server/functions/admin";


export const useAdminUpdateUserMutation = (queryKey: string[]) => {
    const queryClient = useQueryClient();

    return useMutation<any, Error, { userId: number | undefined, payload: Record<string, any> }>({
        mutationFn: ({ userId, payload }) => postAdminUpdateUser({ data: { userId, payload } }),
        onSuccess: async () => await queryClient.invalidateQueries({ queryKey }),
    });
};


export const useAdminUpdateAchievementMutation = (queryKey: string[]) => {
    const queryClient = useQueryClient();

    return useMutation<any, Error, { achievementId: number, payload: Record<string, any> }>({
        mutationFn: ({ achievementId, payload }) => postAdminUpdateAchievement({ data: { achievementId, payload } }),
        onSuccess: async () => await queryClient.invalidateQueries({ queryKey }),
    });
};


export const useAdminUpdateTiersMutation = (queryKey: string[]) => {
    const queryClient = useQueryClient();

    return useMutation<any, Error, { payloads: Record<string, any>[] }>({
        mutationFn: ({ payloads }) => postAdminUpdateTiers({ data: { payloads } }),
        onSuccess: async () => await queryClient.invalidateQueries({ queryKey }),
    });
};
