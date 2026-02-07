import {toast} from "sonner";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {featureVotesOptions} from "@/lib/client/react-query/query-options/query-options";
import {postCreateFeatureRequest, postToggleFeatureVote, postUpdateFeatureStatus} from "@/lib/server/functions/feature-votes";


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
        onError: () => toast.error("Failed to update your vote."),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: featureVotesOptions.queryKey });
        },
    });
};


export const useUpdateFeatureStatusMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postUpdateFeatureStatus,
        onError: () => toast.error("Failed to update the feature status."),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: featureVotesOptions.queryKey });
        },
    });
};
