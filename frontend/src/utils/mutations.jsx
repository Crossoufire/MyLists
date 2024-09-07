import {toast} from "sonner";
import {api} from "@/api/MyApiClient";
import {useUser} from "@/providers/UserProvider";
import {QueryClient, queryOptions, useMutation} from "@tanstack/react-query";


export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            staleTime: 0,
            refetchOnWindowFocus: false,
        },
    },
});

class APIError extends Error {
    constructor(status, message, description, errors = undefined) {
        super(message);
        this.name = "APIError";
        this.status = status;
        this.description = description;
        this.errors = errors;
    }
}

export const fetcher = async (url, queryOrData, options = {}, method = "get") => {
    const response = await api[method](url, queryOrData, options);
    if (!response.ok) {
        throw new APIError(
            response.status,
            response.body.message,
            response.body.description,
            response.body?.errors,
        );
    }
    return response.body?.data;
};

const createPostRequest = async (url, data, options = {}) => {
    return await fetcher(url, data, options, "post");
};

// --- MAPPING ---------------------------------------------------------------------------------------------

export const queryOptionsMap = {
    details: (mediaType, mediaId, external) => queryOptions({
        queryKey: ["details", mediaType, mediaId],
        queryFn: () => fetcher(`/details/${mediaType}/${mediaId}`, { external }),
        staleTime: 2 * 1000,
    }),
    profile: (username) => queryOptions({
        queryKey: ["profile", username],
        queryFn: () => fetcher(`/profile/${username}`),
    }),
    history: (username, filters) => queryOptions({
        queryKey: ["history", username, filters],
        queryFn: () => fetcher(`/profile/${username}/history`, filters),
    }),
    borders: () => queryOptions({
        queryKey: ["borders"],
        queryFn: () => fetcher("/levels/profile_borders") ,
    }),
    trends: () => queryOptions({
        queryKey: ["trends"],
        queryFn: () => fetcher("/current_trends"),
    }),
    upcoming: () => queryOptions({
        queryKey: ["upcoming"],
        queryFn: () => fetcher("/coming_next"),
    }),
    globalStats: () => queryOptions({
        queryKey: ["globalStats"],
        queryFn: () => fetcher("/mylists_stats"),
    }),
    jobDetails: (mediaType, job, name) => queryOptions({
        queryKey: ["jobDetails", mediaType, job, name],
        queryFn: () => fetcher(`/details/${mediaType}/${job}/${name}`),
    }),
    editMedia: (mediaType, mediaId) => queryOptions({
        queryKey: ["editDetails", mediaType, mediaId],
        queryFn: () => fetcher(`/details/edit/${mediaType}/${mediaId}`),
    }),
    list: (mediaType, username, search) => queryOptions({
        queryKey: ["userList", mediaType, username, search],
        queryFn: () => fetcher(`/list/${mediaType}/${username}`, search),
        enabled: false,
        staleTime: Infinity,
    }),
    followers: (username) => queryOptions({
        queryKey: ["followers", username],
        queryFn: () => fetcher(`/profile/${username}/followers`),
    }),
    follows: (username) => queryOptions({
        queryKey: ["follows", username],
        queryFn: () => fetcher(`/profile/${username}/follows`),
    }),
    stats: (mediaType, username) => queryOptions({
        queryKey: ["stats", mediaType, username],
        queryFn: () => fetcher(`/stats/${mediaType}/${username}`),
    }),
    hallOfFame: (search) => queryOptions({
        queryKey: ["hof", search],
        queryFn: () => fetcher("/hall_of_fame", search),
    }),
    smallFilters: (mediaType, username) => queryOptions({
        queryKey: ["smallFilters", mediaType, username],
        queryFn: () => fetcher(`/list/filters/${mediaType}/${username}`),
        staleTime: Infinity,
    }),
    mediaLabels: (mediaType, mediaId, isOpen) => queryOptions({
        queryKey: ["labels", mediaType, mediaId],
        queryFn: () => fetcher(`/labels_for_media/${mediaType}/${mediaId}`, { is_open: isOpen }),
    }),
};

const postFunctionsMap = {
    updateFollowStatus: ({ followId, followStatus }) => createPostRequest(
        "/update_follow", { follow_id: followId, follow_status: followStatus }
    ),
    deleteUserUpdates: ({ updateIds, returnData = false }) => createPostRequest(
        "/delete_updates", { update_ids: updateIds, return_data: returnData }
    ),
    updateMediaDetails: ({ mediaType, mediaId }) => createPostRequest(
        "/details/refresh", { media_id: mediaId, media_type: mediaType }
    ),
    addMediaToUser: ({ mediaType, mediaId, payload }) => createPostRequest(
        "/add_media", { media_id: mediaId, media_type: mediaType, payload }
    ),
    removeMediaFromUser: ({ mediaType, mediaId }) => createPostRequest(
        "/delete_media", { media_id: mediaId, media_type: mediaType }
    ),
    updateUserMedia: ({ url, mediaType, mediaId, payload }) => createPostRequest(
        `/${url}`, { media_id: mediaId, media_type: mediaType, payload }
    ),
    resetPassword: ({ token, newPassword }) => createPostRequest(
        "/tokens/reset_password", { token, new_password: newPassword },
    ),
    registerToken: ({ token }) => createPostRequest(
        "/tokens/register_token", { token },
    ),
    forgotPassword: ({ email }) => createPostRequest(
        "/tokens/reset_password_token", { email, callback: import.meta.env.VITE_RESET_PASSWORD_CALLBACK }
    ),
    renameLabel: ({ mediaType, oldName, newName }) => createPostRequest(
        "/rename_label", { media_type: mediaType, old_label_name: oldName, new_label_name: newName }
    ),
    deleteLabel: ({ mediaType, name }) => createPostRequest(
        "/delete_label", { media_type: mediaType, name }
    ),
    updateModal: () => createPostRequest(
        "/update_modal",
    ),
};

// --- MUTATIONS FUNCTIONS ---------------------------------------------------------------------------------

export const useFollowMutation = (followId, username) => {
    return useMutation({
        mutationFn: postFunctionsMap.updateFollowStatus,
        onError: () => toast.error("The following status could not be changed"),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(["profile", username], (oldData) => {
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
    })
};

export const useRefreshMutation = (mediaType, mediaId) => {
    return useMutation({
        mutationFn: () => postFunctionsMap.updateMediaDetails({ mediaType, mediaId }),
        onError: () => toast.error("An error occurred while updating the mediadata"),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["details", mediaType, mediaId.toString()] });
            toast.success("Mediadata successfully updated");
        }
    })
};

export const useModalMutation = () => {
    const { setCurrentUser } = useUser();
    return useMutation({
        mutationFn: () => postFunctionsMap.updateModal(),
        onError: () => toast.error("An error occurred while updating your preference"),
        onSuccess: () => {
            toast.success("Preference successfully updated");
            setCurrentUser((prev) => ({ ...prev, show_update_modal: false }));
        },
    });
};

export const useAddLabelMutation = (url, mediaType, mediaId) => {
    return useMutation({
        mutationFn: ({ payload }) => postFunctionsMap.updateUserMedia({
            url, mediaType, mediaId, payload
        }),
    })
};

export const useRenameLabelMutation = (mediaType) => {
    return useMutation({
        mutationFn: ({ oldName, newName }) => postFunctionsMap.renameLabel({ mediaType, oldName, newName }),
    })
};

export const useDeleteLabelMutation = (mediaType) => {
    return useMutation({
        mutationFn: ({ name }) => postFunctionsMap.deleteLabel({ mediaType, name }),
    })
};

export const useRemoveLabelMutation = (url, mediaType, mediaId) => {
    return useMutation({
        mutationFn: ({ payload }) => postFunctionsMap.updateUserMedia({ url, mediaType, mediaId, payload }),
    })
};


// --- NEW SHIT ---------------------------------------------------------------------------------------------

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

const createMediaMutation = (url, mediaType, mediaId, queryKey) => {
    return useMutation({
        mutationFn: ({ payload }) => postFunctionsMap.updateUserMedia({ url, mediaType, mediaId, payload }),
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

const createGenericMutation = (mutationFn, onSuccess, onError) => {
    return useMutation({
        mutationFn: mutationFn,
        onSuccess: onSuccess,
        onError: (error) => onError(error),
    });
};

const useUpdateStatus = (mediaType, mediaId, queryKey, onSuccess) => {
    return useMutation({
        mutationFn: ({ payload }) => postFunctionsMap.updateUserMedia({
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
        mutationFn: () => postFunctionsMap.removeMediaFromUser({ mediaType, mediaId }),
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
    })
};

const useAddMediaToList = (mediaType, mediaId, queryKey) => {
    return useMutation({
        mutationFn: ({ payload }) => postFunctionsMap.addMediaToUser({ mediaType, mediaId, payload }),
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
    })
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

export const useDeleteUpdateMutation = (queryKey) => {
    return useMutation({
        mutationFn: postFunctionsMap.deleteUserUpdates,
        onError: () => toast.error("The update(s) could not be deleted"),
        onSuccess: async(data, variables) => {
            if (queryKey[0] === "profile") {
                return queryClient.setQueryData(queryKey, (oldData) => ({
                    ...oldData,
                    user_updates: [ ...oldData.user_updates.filter(up => up.id !== variables.updateIds[0]), data],
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

export const authMutations = (onSuccess, onError) => {
    return {
        resetPassword: createGenericMutation(postFunctionsMap.resetPassword, onSuccess, onError),
        registerToken: createGenericMutation(postFunctionsMap.registerToken, onSuccess, onError),
        forgotPassword: createGenericMutation(postFunctionsMap.forgotPassword, onSuccess, onError),
    };
};
