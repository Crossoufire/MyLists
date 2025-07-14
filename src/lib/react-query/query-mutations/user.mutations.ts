import {useAuth} from "@/lib/hooks/use-auth";
import {ProfileOptionsType} from "@/lib/components/types";
import {ListSettings} from "@/lib/server/types/base.types";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {queryKeys} from "@/lib/react-query/query-options/query-options";
import {postUpdateFollowStatus} from "@/lib/server/functions/user-profile";
import {
    getDownloadListAsCSV,
    postDeleteUserAccount,
    postGeneralSettings,
    postMediaListSettings,
    postPasswordSettings,
    postUpdateFeatureFlag
} from "@/lib/server/functions/user-settings";


export const useFollowMutation = (username: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ followId, followStatus }: { followId: number, followStatus: boolean }) => {
            return postUpdateFollowStatus({ data: { followId, followStatus } })
        },
        onSuccess: (_, variables) => {
            queryClient.setQueryData<ProfileOptionsType>(queryKeys.profileKey(username), (oldData) => {
                if (!oldData) return;

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
