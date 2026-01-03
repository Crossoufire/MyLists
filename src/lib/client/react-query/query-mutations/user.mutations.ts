import {useAuth} from "@/lib/client/hooks/use-auth";
import {ListSettings} from "@/lib/types/zod.schema.types";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {postUpdateFollowStatus} from "@/lib/server/functions/user-profile";
import {followersOptions, followsOptions, profileOptions} from "@/lib/client/react-query/query-options/query-options";
import {
    getDownloadListAsCSV,
    postDeleteUserAccount,
    postGeneralSettings,
    postMediaListSettings,
    postPasswordSettings,
    postUpdateFeatureFlag
} from "@/lib/server/functions/user-settings";


export const useFollowMutation = (ownerUsername: string, isOwnerProfilePage = true) => {
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postUpdateFollowStatus,
        onSuccess: (_data, variables) => {
            if (isOwnerProfilePage) {
                queryClient.setQueryData(profileOptions(ownerUsername).queryKey, (oldData) => {
                    if (!oldData) return;

                    return {
                        ...oldData,
                        isFollowing: variables.data.followStatus,
                        followersCount: variables.data.followStatus ? oldData.followersCount + 1 : oldData.followersCount - 1
                    };
                });

                queryClient.setQueryData(followersOptions(ownerUsername).queryKey, (oldData) => {
                    if (!oldData) return;

                    if (variables.data.followStatus === true) {
                        return {
                            ...oldData, followers: [...oldData.followers, {
                                id: currentUser!.id,
                                isFollowedByMe: true,
                                image: currentUser!.image!,
                                username: currentUser!.name,
                                privacy: currentUser!.privacy,
                            }]
                        };
                    }

                    return { ...oldData, followers: oldData.followers.filter((f) => f.id !== currentUser!.id) };
                });
            }
            else {
                queryClient.setQueryData(followersOptions(ownerUsername).queryKey, (oldData) => {
                    if (!oldData) return;

                    return {
                        ...oldData,
                        followers: oldData.followers.map((f) =>
                            f.id === variables.data.followId ? { ...f, isFollowedByMe: variables.data.followStatus } : f
                        )
                    };
                });

                queryClient.setQueryData(followsOptions(ownerUsername).queryKey, (oldData) => {
                    if (!oldData) return;

                    return {
                        ...oldData,
                        follows: oldData.follows.map((f) =>
                            f.id === variables.data.followId ? { ...f, isFollowedByMe: variables.data.followStatus } : f
                        )
                    };
                });
            }
        },
    });
};


export const useGeneralSettingsMutation = () => {
    return useMutation({
        mutationFn: ({ data }: { data: FormData }) => postGeneralSettings({ data }),
    });
};


export const useListSettingsMutation = () => {
    return useMutation({
        mutationFn: ({ data }: { data: ListSettings }) => postMediaListSettings({ data })
    });
};


export const useDownloadListAsCSVMutation = () => {
    return useMutation({
        mutationFn: ({ selectedList }: { selectedList: string }) => {
            return getDownloadListAsCSV({ data: { selectedList } })
        },
    });
};


export const usePasswordSettingsMutation = () => {
    return useMutation({
        mutationFn: ({ currentPassword, newPassword }: { currentPassword: string, newPassword: string }) => {
            return postPasswordSettings({ data: { currentPassword, newPassword } })
        },
    });
};


export const useDeleteAccountMutation = () => {
    return useMutation({
        mutationFn: () => postDeleteUserAccount()
    });
};


export const useFeatureFlagMutation = () => {
    const { setCurrentUser } = useAuth();

    return useMutation({
        mutationFn: () => postUpdateFeatureFlag(),
        onSuccess: () => setCurrentUser(),
    });
};
