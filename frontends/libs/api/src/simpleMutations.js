import {useAuth} from "./useAuthHook";
import {queryKeys} from "./queryOptions";
import {fetcher, postFetcher} from "./utils";
import {useMutation, useQueryClient} from "@tanstack/react-query";


const mutationFunctionsMap = {
    updateFollowStatus: ({ followId, followStatus }) => postFetcher({
        url: "/update_follow", data: { follow_id: followId, follow_status: followStatus },
    }),
    deleteUserUpdates: ({ updateIds, returnData = false }) => postFetcher({
        url: "/delete_updates", data: { update_ids: updateIds, return_data: returnData },
    }),
    updateMediaDetails: ({ mediaType, mediaId }) => postFetcher({
        url: "/details/refresh", data: { media_type: mediaType, media_id: mediaId },
    }),
    resetPassword: ({ token, new_password }) => postFetcher({
        url: "/tokens/reset_password", data: { token, new_password },
    }),
    registerToken: ({ token }) => postFetcher({
        url: "/tokens/register_token", data: { token },
    }),
    forgotPassword: ({ email, callback }) => postFetcher({
        url: "/tokens/reset_password_token", data: { email, callback },
    }),
    updateModal: () => postFetcher({
        url: "/update_modal",
    }),
    listSettings: (data) => postFetcher({
        url: "/settings/medialist", data,
    }),
    deleteAccount: () => postFetcher({
        url: "/settings/delete_account",
    }),
    passwordSettings: (data) => postFetcher({
        url: "/settings/password", data,
    }),
    downloadListAsCSV: ({ selectedList }) => fetcher({
        url: `/settings/download/${selectedList}`,
    }),
    oAuth2Provider: ({ provider, callback }) => fetcher({
        url: `/tokens/oauth2/${provider}`, queryOrData: { callback },
    }),
    otherUserStats: ({ mediaType, username }) => fetcher({
        url: `/stats/${mediaType}/${username}`,
    }),
    editMediaDetails: ({ mediaType, mediaId, payload }) => postFetcher({
        url: `/details/edit`,
        data: { media_id: mediaId, media_type: mediaType, payload },
    }),
    generalSettings: ({ data }) => postFetcher({
        url: "/settings/general", data, options: { removeContentType: true },
    }),
};


export const simpleMutations = () => {
    const resetPassword = useMutation({ mutationFn: mutationFunctionsMap.resetPassword });
    const registerToken = useMutation({ mutationFn: mutationFunctionsMap.registerToken });
    const forgotPassword = useMutation({ mutationFn: mutationFunctionsMap.forgotPassword });
    const listSettings = useMutation({ mutationFn: mutationFunctionsMap.listSettings });
    const deleteAccount = useMutation({ mutationFn: mutationFunctionsMap.deleteAccount });
    const passwordSettings = useMutation({ mutationFn: mutationFunctionsMap.passwordSettings });
    const downloadListAsCSV = useMutation({ mutationFn: mutationFunctionsMap.downloadListAsCSV });
    const oAuth2Provider = useMutation({ mutationFn: mutationFunctionsMap.oAuth2Provider });
    const otherUserStats = useMutation({ mutationFn: mutationFunctionsMap.otherUserStats });
    const editMediaMutation = useMutation({ mutationFn: mutationFunctionsMap.editMediaDetails });
    const generalSettings = useMutation({ mutationFn: mutationFunctionsMap.generalSettings });

    return {
        resetPassword, registerToken, forgotPassword, listSettings, deleteAccount, passwordSettings,
        downloadListAsCSV, oAuth2Provider, otherUserStats, editMediaMutation, generalSettings
    };
};


export const useDeleteUpdateMutation = (queryKey) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: mutationFunctionsMap.deleteUserUpdates,
        meta: { errorMessage: "The update(s) could not be deleted" },
        onSuccess: async (data, variables) => {
            if (queryKey[0] === "profile") {
                return queryClient.setQueryData(queryKey, (oldData) => ({
                    ...oldData,
                    user_updates: [...oldData.user_updates.filter(up => up.id !== variables.updateIds[0]), data],
                }));
            }
            else if (queryKey[0] === "allUpdates") {
                await queryClient.invalidateQueries({ queryKey });
            }
            else if (queryKey[0] === "onOpenHistory") {
                return queryClient.setQueryData(queryKey, (oldData) => {
                    return [...oldData.filter(hist => hist.id !== variables.updateIds[0])];
                });
            }
        },
    });
};


export const useFollowMutation = (queryKey) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: mutationFunctionsMap.updateFollowStatus,
        onSuccess: (data, variables) => {
            queryClient.setQueryData(queryKey, (oldData) => {
                return {
                    ...oldData,
                    is_following: variables.followStatus,
                    user_data: {
                        ...oldData.user_data,
                        followers_count: variables.followStatus ? oldData.user_data.followers_count + 1 :
                            oldData.user_data.followers_count - 1,
                    }
                };
            });
        },
    });
};


export const useRefreshMutation = (queryKey) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: mutationFunctionsMap.updateMediaDetails,
        onSuccess: async () => await queryClient.invalidateQueries({ queryKey }),
    });
};


export const useModalMutation = () => {
    const { setCurrentUser } = useAuth();
    return useMutation({
        mutationFn: mutationFunctionsMap.updateModal,
        onSuccess: () => setCurrentUser((prev) => ({ ...prev, show_update_modal: false })),
    });
};


export const useMakeGuess = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ guess }) => postFetcher({ url: "/daily-mediadle/guess", data: { guess } }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: queryKeys.dailyMediadleKey() });
        }
    });
};