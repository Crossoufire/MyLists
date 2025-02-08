import {postFetcher, useAuth} from "@/api";
import {useMutation, useQueryClient} from "@tanstack/react-query";


const userUrls = {
    updateFollowStatus: () => "/update_follow",
    deleteUserUpdates: () => "/delete_updates",
    updateModal: () => "/update_modal",
};


export const useUpdateFollowMutation = () => {
    return useMutation({
        mutationFn: ({ followId, followStatus }) =>
            postFetcher({
                url: userUrls.updateFollowStatus(),
                data: { follow_id: followId, follow_status: followStatus },
            }),
    });
};


export const useFollowMutation = (queryKey) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ followId, followStatus }) =>
            postFetcher({
                url: userUrls.updateFollowStatus(),
                data: { follow_id: followId, follow_status: followStatus },
            }),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(queryKey, (oldData) => {
                return {
                    ...oldData,
                    is_following: variables.followStatus,
                    user_data: {
                        ...oldData.user_data,
                        followers_count: variables.followStatus ?
                            oldData.user_data.followers_count + 1
                            :
                            oldData.user_data.followers_count - 1,
                    }
                };
            });
        },
    });
};


export const useUpdateModalMutation = () => {
    const { setCurrentUser } = useAuth();
    return useMutation({
        mutationFn: () => postFetcher({ url: userUrls.updateModal() }),
        onSuccess: () => setCurrentUser((prev) => ({ ...prev, show_update_modal: false })),
    });
};
