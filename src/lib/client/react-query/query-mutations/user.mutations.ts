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


export const useFollowMutation = (username: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postUpdateFollowStatus,
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: followersOptions(username).queryKey });
            queryClient.invalidateQueries({ queryKey: followsOptions(username).queryKey });
            queryClient.invalidateQueries({ queryKey: profileOptions(username).queryKey });
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
