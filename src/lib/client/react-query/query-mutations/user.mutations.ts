import {useAuth} from "@/lib/client/hooks/use-auth";
import {ListSettings} from "@/lib/types/zod.schema.types";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {postUpdateFollowStatus} from "@/lib/server/functions/user-profile";
import {profileOptions} from "@/lib/client/react-query/query-options/query-options";
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
        mutationFn: postUpdateFollowStatus,
        onSuccess: (_data, variables) => {
            queryClient.setQueryData(profileOptions(username).queryKey, (oldData) => {
                if (!oldData) return;

                return {
                    ...oldData,
                    isFollowing: variables.data.followStatus,
                    userData: {
                        ...oldData.userData,
                        followersCount: variables.data.followStatus ? oldData.userData.followersCount + 1 : oldData.userData.followersCount - 1,
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
