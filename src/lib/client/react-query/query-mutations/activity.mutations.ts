import {SectionParams} from "@/lib/types/activity.types";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {sectionActivityOptions} from "@/lib/client/react-query/query-options/query-options";
import {postDeleteSpecificActivity, postUpdateSpecificActivity} from "@/lib/server/functions/user-stats";


export const useUpdateActivityMutation = (username: string, sectionParams: SectionParams) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postUpdateSpecificActivity,
        meta: { errorMessage: "Failed to update activity event." },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: sectionActivityOptions(username, sectionParams).queryKey });
        },
    });
};


export const useDeleteActivityMutation = (username: string, sectionParams: SectionParams) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postDeleteSpecificActivity,
        meta: { errorMessage: "Failed to delete activity event." },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: sectionActivityOptions(username, sectionParams).queryKey });
        },
    });
};
