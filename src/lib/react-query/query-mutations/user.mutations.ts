import {useMutation, useQueryClient} from "@tanstack/react-query";
import {postUpdateFollowStatus} from "@/lib/server/functions/user-profile";


export const useFollowMutation = (queryKey: string[]) => {
    const queryClient = useQueryClient();

    return useMutation<void, Error, { followId: number, followStatus: boolean }>({
        mutationFn: ({ followId, followStatus }) => postUpdateFollowStatus({ data: { followId, followStatus } }),
        onSuccess: (_data, variables) => {
            queryClient.setQueryData(queryKey, (oldData: any) => {
                return {
                    ...oldData,
                    isFollowing: variables.followStatus,
                    userData: {
                        ...oldData.userData,
                        followersCount: variables.followStatus ? oldData.userData.followersCount + 1 : oldData.userData.followersCount - 1,
                    }
                };
            });
        },
    });
};
