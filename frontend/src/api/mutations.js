import {toast} from "sonner";
import {useAuth} from "@/hooks/AuthHook";
import {queryClient} from "@/api/queryClient";
import {useMutation} from "@tanstack/react-query";
import {fetcher, postFetcher} from "@/api/fetcher";


// --- MUTATIONS CREATION ---------------------------------------------------------------------------------

const createMediaMutation = (url, mediaType, mediaId, queryKey) => {
    return useMutation({
        mutationFn: ({ payload }) => mutationFunctionsMap.updateUserMedia({ url, mediaType, mediaId, payload }),
        onError: () => toast.error(`Failed to update the ${url.replace("update_", "")} value`),
        onSuccess: (data, variables) => {
            const updateFn = updateMediaMap[url];
            queryClient.setQueryData(queryKey, (oldData) => {
                if (queryKey[0] === "details") {
                    return { ...oldData, user_data: updateFn(oldData.user_data, variables.payload) };
                }
                return {
                    ...oldData,
                    media_data: oldData.media_data.map(media =>
                        media.media_id === mediaId ? updateFn(media, variables.payload) : media
                    )
                };
            });
        },
    });
};


// --- MUTATIONS MAPPING -----------------------------------------------------------------------------------

const mutationFunctionsMap = {
    updateFollowStatus: ({ followId, followStatus }) => postFetcher({
        url: "/update_follow", data: { follow_id: followId, follow_status: followStatus },
    }),
    deleteUserUpdates: ({ updateIds, returnData = false }) => postFetcher({
        url: "/delete_updates", data: { update_ids: updateIds, return_data: returnData },
    }),
    updateMediaDetails: ({ mediaType, mediaId }) => postFetcher({
        url: "/details/refresh", data: { media_id: mediaId, media_type: mediaType },
    }),
    addMediaToUser: ({ mediaType, mediaId, payload }) => postFetcher({
        url: "/add_media", data: { media_id: mediaId, media_type: mediaType, payload },
    }),
    removeMediaFromUser: ({ mediaType, mediaId }) => postFetcher({
        url: "/delete_media", data: { media_id: mediaId, media_type: mediaType },
    }),
    updateUserMedia: ({ url, mediaType, mediaId, payload }) => postFetcher({
        url: `/${url}`, data: { media_id: mediaId, media_type: mediaType, payload },
    }),
    resetPassword: ({ token, newPassword }) => postFetcher({
        url: "/tokens/reset_password", data: { token, new_password: newPassword },
    }),
    registerToken: ({ token }) => postFetcher({
        url: "/tokens/register_token", data: { token },
    }),
    forgotPassword: ({ email }) => postFetcher({
        url: "/tokens/reset_password_token", data: { email, callback: import.meta.env.VITE_RESET_PASSWORD_CALLBACK },
    }),
    renameLabel: ({ mediaType, oldName, newName }) => postFetcher({
        url: "/rename_label", data: { media_type: mediaType, old_label_name: oldName, new_label_name: newName },
    }),
    deleteLabel: ({ mediaType, name }) => postFetcher({
        url: "/delete_label", data: { media_type: mediaType, name },
    }),
    updateModal: () => postFetcher({
        url: "/update_modal",
    }),
    listSettings: ({ data }) => postFetcher({
        url: "/settings/medialist", data: { data },
    }),
    deleteAccount: () => postFetcher({
        url: "/settings/delete_account",
    }),
    passwordSettings: ({ data }) => postFetcher({
        url: "/settings/password", data: { data },
    }),
    downloadListAsCSV: ({ selectedList }) => fetcher({
        url: `/settings/download/${selectedList}`,
    }),
    oAuth2Provider: ({ provider }) => fetcher({
        url: `/tokens/oauth2/${provider}`, queryOrData: {
            callback: import.meta.env.VITE_OAUTH2_CALLBACK.replace("{provider}", provider)
        },
    }),
    otherUserStats: ({ mediaType, username }) => fetcher({
        url: `/stats/${mediaType}/${username}`,
    }),
    editMediaDetails: ({ mediaType, mediaId, payload }) => postFetcher({
        url: `/details/edit/${mediaType}/${mediaId}`,
        queryOrData: { media_id: mediaId, media_type: mediaType, payload },
    }),
    generalSettings: ({ data }) => postFetcher({
        url: "/settings/general",
        queryOrData: data,
        options: { removeContentType: true },
    }),
};

const updateMediaMap = {
    update_rating: (media, value) => ({ ...media, rating: { ...media.rating, value: value } }),
    update_comment: (media, value) => ({ ...media, comment: value }),
    update_favorite: (media, value) => ({ ...media, favorite: value }),
    update_redo: (media, value) => ({ ...media, redo: value }),
    update_playtime: (media, value) => ({ ...media, playtime: value }),
    update_page: (media, value) => ({ ...media, page: value }),
    update_platform: (media, value) => ({ ...media, platform: value }),
    update_season: (media, value) => ({ ...media, current_season: value }),
    update_episode: (media, value) => ({ ...media, last_episode_watched: value }),
};

// --- MUTATIONS -------------------------------------------------------------------------------------------

export const genericMutations = () => {
    return {
        resetPassword: useMutation({ mutationFn: mutationFunctionsMap.resetPassword }),
        registerToken: useMutation({ mutationFn: mutationFunctionsMap.registerToken }),
        forgotPassword: useMutation({ mutationFn: mutationFunctionsMap.forgotPassword }),
        listSettings: useMutation({ mutationFn: mutationFunctionsMap.listSettings }),
        deleteAccount: useMutation({ mutationFn: mutationFunctionsMap.deleteAccount }),
        passwordSettings: useMutation({ mutationFn: mutationFunctionsMap.passwordSettings }),
        downloadListAsCSV: useMutation({ mutationFn: mutationFunctionsMap.downloadListAsCSV }),
        oAuth2Provider: useMutation({ mutationFn: mutationFunctionsMap.oAuth2Provider }),
        otherUserStats: useMutation({ mutationFn: mutationFunctionsMap.otherUserStats }),
        editMediaMutation: useMutation({ mutationFn: mutationFunctionsMap.editMediaDetails }),
        generalSettings: useMutation({ mutationFn: mutationFunctionsMap.generalSettings }),
    };
};

export const userMediaMutations = (mediaType, mediaId, queryKey) => {
    return {
        updateRating: createMediaMutation("update_rating", mediaType, mediaId, queryKey),
        updateComment: createMediaMutation("update_comment", mediaType, mediaId, queryKey),
        updateFavorite: createMediaMutation("update_favorite", mediaType, mediaId, queryKey),
        updateRedo: createMediaMutation("update_redo", mediaType, mediaId, queryKey),
        updatePlaytime: createMediaMutation("update_playtime", mediaType, mediaId, queryKey),
        updatePage: createMediaMutation("update_page", mediaType, mediaId, queryKey),
        updatePlatform: createMediaMutation("update_platform", mediaType, mediaId, queryKey),
        updateSeason: createMediaMutation("update_season", mediaType, mediaId, queryKey),
        updateEpisode: createMediaMutation("update_episode", mediaType, mediaId, queryKey),
        addToList: useAddMediaToList(mediaType, mediaId, queryKey),
        removeFromList: useRemoveFromList(mediaType, mediaId, queryKey),
        updateStatusFunc: (onSuccessHandler) => useUpdateStatus(mediaType, mediaId, queryKey, onSuccessHandler),
    };
};

export const userLabelsMutations = (mediaType, mediaId) => {
    return {
        addLabel: useAddLabelMutation("add_media_to_label", mediaType, mediaId),
        removeLabel: useRemoveLabelMutation("remove_label_from_media", mediaType, mediaId),
        renameLabel: useRenameLabelMutation(mediaType),
        deleteLabel: useDeleteLabelMutation(mediaType),
    };
};

export const useDeleteUpdateMutation = (queryKey) => {
    return useMutation({
        mutationFn: mutationFunctionsMap.deleteUserUpdates,
        onError: () => toast.error("The update(s) could not be deleted"),
        onSuccess: async (data, variables) => {
            if (queryKey[0] === "profile") {
                return queryClient.setQueryData(queryKey, (oldData) => ({
                    ...oldData,
                    user_updates: [...oldData.user_updates.filter(up => up.id !== variables.updateIds[0]), data],
                }));
            }
            else if (queryKey[0] === "details") {
                return queryClient.setQueryData(queryKey, (oldData) => ({
                    ...oldData,
                    user_data: {
                        ...oldData.user_data,
                        history: oldData.user_data.history.filter(hist => hist.id !== variables.updateIds[0]),
                    },
                }));
            }
            else if (queryKey[0] === "history") {
                await queryClient.invalidateQueries({ queryKey });
            }
            toast.success("Update(s) successfully deleted");
        },
    });
};

export const useFollowMutation = (queryKey) => {
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

// --- INTERNAL MUTATIONS ----------------------------------------------------------------------------------

const useAddLabelMutation = (url, mediaType, mediaId) => {
    return useMutation({
        mutationFn: ({ payload }) => {
            return mutationFunctionsMap.updateUserMedia({ url, mediaType, mediaId, payload });
        },
    });
};

const useRemoveLabelMutation = (url, mediaType, mediaId) => {
    return useMutation({
        mutationFn: ({ payload }) => {
            return mutationFunctionsMap.updateUserMedia({ url, mediaType, mediaId, payload });
        },
    });
};

const useRenameLabelMutation = (mediaType) => {
    return useMutation({
        mutationFn: ({ oldName, newName }) => {
            return mutationFunctionsMap.renameLabel({ mediaType, oldName, newName });
        },
    });
};

const useDeleteLabelMutation = (mediaType) => {
    return useMutation({
        mutationFn: ({ name }) => mutationFunctionsMap.deleteLabel({ mediaType, name }),
    });
};

const useUpdateStatus = (mediaType, mediaId, queryKey, onSuccess) => {
    return useMutation({
        mutationFn: ({ payload }) => mutationFunctionsMap.updateUserMedia({
            url: "update_status", mediaType, mediaId, payload
        }),
        onError: () => toast.error("Failed to update the status value"),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(queryKey, (oldData) => onSuccess(oldData, variables));
        },
    });
};

const useRemoveFromList = (mediaType, mediaId, queryKey) => {
    return useMutation({
        mutationFn: () => mutationFunctionsMap.removeMediaFromUser({ mediaType, mediaId }),
        onError: () => toast.error("Failed to remove the media from your list"),
        onSuccess: () => {
            toast.success("Media removed from your list");
            queryClient.setQueryData(queryKey, (oldData) => {
                if (queryKey[0] === "details") {
                    return { ...oldData, user_data: false };
                }
                return { ...oldData, media_data: [...oldData.media_data.filter(m => m.media_id !== mediaId)] };
            });
        }
    });
};

const useAddMediaToList = (mediaType, mediaId, queryKey) => {
    return useMutation({
        mutationFn: ({ payload }) => mutationFunctionsMap.addMediaToUser({ mediaType, mediaId, payload }),
        onError: () => toast.error("Failed to add the media to your list"),
        onSuccess: (data) => {
            toast.success("Media added to your list");
            queryClient.setQueryData(queryKey, (oldData) => {
                if (queryKey[0] === "details") {
                    return { ...oldData, user_data: data };
                }
                return {
                    ...oldData,
                    media_data: [
                        ...oldData.media_data.map(m => {
                            if (m.media_id === mediaId) {
                                return { ...m, common: true };
                            }
                            return m;
                        })
                    ]
                };
            });
        }
    });
};
