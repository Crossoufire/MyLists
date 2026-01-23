import {toast} from "sonner";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {ListSettings} from "@/lib/types/zod.schema.types";
import {postUpdateShowOnboarding} from "@/lib/server/functions/user-profile";
import {QueryClient, useMutation, useQueryClient} from "@tanstack/react-query";
import {postFollow, postRemoveFollower, postRespondToFollowRequest, postUnfollow} from "@/lib/server/functions/social";
import {followersOptions, followsOptions, notificationsCountOptions, notificationsOptions, profileHeaderOptions} from "@/lib/client/react-query/query-options/query-options";
import {
    getDownloadListAsCSV,
    postDeleteUserAccount,
    postGeneralSettings,
    postMediaListSettings,
    postPasswordSettings,
    postUpdateFeatureFlag
} from "@/lib/server/functions/user-settings";
import {markAllNotifAsRead, postDeleteSocialNotif} from "@/lib/server/functions/notifications";


const invalidateSocialQueries = async (queryClient: QueryClient, username: string) => {
    await Promise.all([
        queryClient.invalidateQueries({ queryKey: followsOptions(username).queryKey }),
        queryClient.invalidateQueries({ queryKey: followersOptions(username).queryKey }),
        queryClient.invalidateQueries({ queryKey: profileHeaderOptions(username).queryKey }),
    ]);
};


export const useFollowMutation = (profileUsername: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postFollow,
        onSuccess: () => invalidateSocialQueries(queryClient, profileUsername),
    });
};


export const useUnfollowMutation = (profileUsername: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postUnfollow,
        onSuccess: () => invalidateSocialQueries(queryClient, profileUsername),
    });
};


export const useRespondFollowRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postRespondToFollowRequest,
        onError: (error) => toast.info(error.message || "This follow request was canceled."),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: notificationsCountOptions.queryKey });
            await queryClient.invalidateQueries({ queryKey: notificationsOptions(false, "social").queryKey });
        }
    })
}


export const useDeleteSocialNotif = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postDeleteSocialNotif,
        onError: (error) => toast.error(error.message ?? "Can't delete this notification."),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: notificationsOptions(false, "social").queryKey });
        }
    })
}


export const useMarkAllNotifAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: markAllNotifAsRead,
        onError: (error) => toast.error(error.message || "Failed to mark all notifications as read."),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: notificationsCountOptions.queryKey });
        }
    })
};


export const useRemoveFollowerMutation = (profileUsername: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: postRemoveFollower,
        onSuccess: () => invalidateSocialQueries(queryClient, profileUsername),
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


export const useUpdateOnboardingMutation = () => {
    const { setCurrentUser } = useAuth();

    return useMutation({
        mutationFn: () => postUpdateShowOnboarding(),
        onError: (error) => toast.error(error.message ?? "Can't update your onboarding status."),
        onSuccess: () => setCurrentUser(),
    });
};
