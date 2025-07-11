import {useAuth} from "@/lib/hooks/use-auth";
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

    return useMutation<void, Error, { followId: number, followStatus: boolean }>({
        mutationFn: ({ followId, followStatus }) => postUpdateFollowStatus({ data: { followId, followStatus } }),
        onSuccess: (_data, variables) => {
            queryClient.setQueryData(queryKeys.profileKey(username), (oldData: any) => {
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
    return useMutation<void, Error, { data: FormData }>({
        mutationFn: ({ data }) => postGeneralSettings({ data }),
    });
};


export const useListSettingsMutation = () => {
    return useMutation<void, Error, { data: ListSettings }>({
        mutationFn: ({ data }) => postMediaListSettings({ data })
    });
};


export const useDownloadListAsCSVMutation = () => {
    return useMutation<Awaited<ReturnType<NonNullable<typeof getDownloadListAsCSV>>>, Error, { selectedList: string }>({
        mutationFn: ({ selectedList }) => getDownloadListAsCSV({ data: { selectedList } }),
    });
};


export const usePasswordSettingsMutation = () => {
    return useMutation<void, Error, { currentPassword: string, newPassword: string }>({
        mutationFn: ({ currentPassword, newPassword }) => postPasswordSettings({ data: { currentPassword, newPassword } }),
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
