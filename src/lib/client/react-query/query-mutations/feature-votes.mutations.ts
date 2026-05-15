import {toast} from "sonner";
import {getZodMutationError} from "@/lib/utils/helpers";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {featureVotesOptions} from "@/lib/client/react-query/query-options/query-options";
import {postCreateFeatureRequest, postDeleteFeatureRequest, postToggleFeatureVote, postUpdateFeatureStatus} from "@/lib/server/functions/feature-votes";


export const useCreateFeatureRequestMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postCreateFeatureRequest,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: featureVotesOptions.queryKey }),
    });
};


export const useToggleFeatureVoteMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postToggleFeatureVote,
        onError: (err) => toast.error(getZodMutationError(err) || "Failed to update your vote."),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: featureVotesOptions.queryKey });
        },
    });
};


export const useUpdateFeatureStatusMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postUpdateFeatureStatus,
        onError: (err) => toast.error(getZodMutationError(err) || "Failed to update the feature status."),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: featureVotesOptions.queryKey });
        },
    });
};


export const useDeleteFeatureRequestMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postDeleteFeatureRequest,
        onError: (err) => toast.error(getZodMutationError(err) || "Failed to delete the feature request."),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: featureVotesOptions.queryKey });
        },
    });
};
