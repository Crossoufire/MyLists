import {useMutation, useQueryClient} from "@tanstack/react-query";
import {postAddActivity, postBulkHideActivity, postDeleteActivity, postUpdateActivity} from "@/lib/server/functions/user-activity";


export const useAddActivityMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postAddActivity,
        meta: { errorMessage: "Failed to add activity." },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["monthly-activity"] });
            await queryClient.invalidateQueries({ queryKey: ["specific-activity"] });
        },
    });
};


export const useUpdateActivityMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postUpdateActivity,
        meta: { errorMessage: "Failed to update activity." },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["monthly-activity"] });
            await queryClient.invalidateQueries({ queryKey: ["specific-activity"] });
        },
    });
};


export const useDeleteActivityMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postDeleteActivity,
        meta: { errorMessage: "Failed to delete activity." },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["monthly-activity"] });
        },
    });
};


export const useBulkHideActivityMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postBulkHideActivity,
        meta: { errorMessage: "Failed to bulk hide activity." },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["monthly-activity"] });
            await queryClient.invalidateQueries({ queryKey: ["specific-activity"] });
        },
    });
};
