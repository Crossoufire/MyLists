import {useMutation, useQueryClient} from "@tanstack/react-query";
import {postUpdateFollowStatus} from "@/lib/server/functions/user-profile";
import {getDownloadListAsCSV, postGeneralSettings, postMediaListSettings, postPasswordSettings} from "@/lib/server/functions/user-settings";
import {ListSettings} from "@/lib/server/types/base.types";


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


// export const useDeleteAccountMutation = () => {
//     return useMutation({
//         mutationFn: () =>
//             postFetcher({
//                 url: settingsUrls.deleteAccount(),
//             }),
//     });
// };
