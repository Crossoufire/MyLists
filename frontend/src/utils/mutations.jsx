import {toast} from "sonner";
import {api} from "@/api/MyApiClient.js";
import {useNavigate} from "@tanstack/react-router";
import {QueryClient, queryOptions, useMutation} from "@tanstack/react-query";
import {useUser} from "@/providers/UserProvider.jsx";


export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            staleTime: 0,
            refetchOnWindowFocus: false,
        },
    },
});

export const fetcher = async (url, query, options) => {
    const response = await api.get(url, query, options);
    if (!response.ok) {
        throw new Error(
            JSON.stringify({
                status: response.status,
                message: response.body.message,
                description: response.body.description,
            })
        );
    }
    return response.body.data;
};

const createQueryOptions = (queryKey, endpoint, params = {}, options = {}) => {
    return queryOptions({ queryKey: queryKey, queryFn: () => fetcher(endpoint, params), ...options });
};

const createPostRequest = async (url, data) => {
    const response = await api.post(url, data);
    if (!response.ok) {
        throw new Error(
            JSON.stringify({
                status: response.status,
                message: response.body.message,
                description: response.body.description,
            })
        );
    }
    return response.body?.data || true;
};

// --- MAPPING ---------------------------------------------------------------------------------------------

export const queryOptionsMap = {
    details: (mediaType, mediaId, external) => createQueryOptions(
        ["details", mediaType, mediaId], `/details/${mediaType}/${mediaId}`, { external },
        { staleTime: 2 * 1000 },
    ),
    profile: (username) => createQueryOptions(["profile", username], `/profile/${username}`),
    history: (username, filters) => createQueryOptions(
        ["history", username, filters], `/profile/${username}/history`, filters,
    ),
    borders: () => createQueryOptions(["borders"], "/levels/profile_borders"),
    trends: () => createQueryOptions(["trends"], "/current_trends"),
    upcoming: () => createQueryOptions(["upcoming"], "/coming_next"),
    globalStats: () => createQueryOptions(["globalStats"], "/mylists_stats"),
    jobDetails: (mediaType, job, name) => createQueryOptions(
        ["jobDetails", mediaType, job, name], `/details/${mediaType}/${job}/${name}`,
    ),
    editMedia: (mediaType, mediaId) => createQueryOptions(
        ["editDetails", mediaType, mediaId], `/details/edit/${mediaType}/${mediaId}`,
    ),
    list: (mediaType, username, search) => createQueryOptions(
        ["userList", mediaType, username, search], `/list/${mediaType}/${username}`, search,
        { gcTime: 30 * 1000 },
    ),
    followers: (username) => createQueryOptions(["followers", username], `/profile/${username}/followers`),
    follows: (username) => createQueryOptions(["follows", username], `/profile/${username}/follows`),
    stats: (mediaType, username) => createQueryOptions(
        ["stats", mediaType, username], `/stats/${mediaType}/${username}`,
    ),
    hallOfFame: (search) => createQueryOptions(["hof", search], "/hall_of_fame", search),
    smallFilters: (mediaType, username) => createQueryOptions(
        ["smallFilters", mediaType, username], `/list/filters/${mediaType}/${username}`,
        undefined,
        { staleTime: Infinity },
    ),
    mediaLabels: (mediaType, mediaId, isOpen) => createQueryOptions(
        ["labels", mediaType, mediaId], `/labels_for_media/${mediaType}/${mediaId}`,
        undefined,
        { enabled: isOpen },
    ),
};

const postFunctions = {
    updateFollowStatus: ({ followId, followStatus }) => createPostRequest("/update_follow", {
        follow_id: followId, follow_status: followStatus
    }),
    deleteUserUpdates: ({ updateIds, returnData = false }) => createPostRequest("/delete_updates", {
        update_ids: updateIds, return_data: returnData
    }),
    updateMediaDetails: ({ mediaType, mediaId }) => createPostRequest("/details/refresh", {
        media_id: mediaId, media_type: mediaType
    }),
    addMediaToUser: ({ mediaType, mediaId, payload }) => createPostRequest("/add_media", {
        media_id: mediaId, media_type: mediaType, payload
    }),
    removeMediaFromUser: ({ mediaType, mediaId }) => createPostRequest("/delete_media", {
        media_id: mediaId, media_type: mediaType
    }),
    updateUserMedia: ({ url, mediaType, mediaId, payload }) => createPostRequest(`/${url}`, {
        media_id: mediaId, media_type: mediaType, payload
    }),
    resetPassword: ({ token, newPassword }) => createPostRequest("/tokens/reset_password", {
        token, new_password: newPassword
    }),
    registerToken: ({ token }) => createPostRequest("/tokens/register_token", { token }),
    forgotPassword: ({ email }) => createPostRequest("/tokens/reset_password_token", {
        email,
        callback: import.meta.env.VITE_RESET_PASSWORD_CALLBACK
    }),
    renameLabel: ({ mediaType, oldName, newName }) => createPostRequest("/rename_label", {
        media_type: mediaType, old_label_name: oldName, new_label_name: newName
    }),
    deleteLabel: ({ mediaType, name }) => createPostRequest("/delete_label", {
        media_type: mediaType, name
    }),
    updateModal: () => createPostRequest("/update_modal"),
};

// --- MUTATIONS FUNCTIONS ---------------------------------------------------------------------------------

export const useDeleteMultiUpdateMutation = (username, filters) => {
    return useMutation({
        mutationFn: ({ updateIds }) => postFunctions.deleteUserUpdates({ updateIds }),
        onError: () => toast.error("The update(s) could not be deleted"),
        onSuccess: async () => {
            toast.success("Update(s) deleted");
            await queryClient.invalidateQueries({ queryKey: ["history", username, filters] });
        },
    });
};

export const useFollowMutation = (followId, username) => {
    return useMutation({
        mutationFn: postFunctions.updateFollowStatus,
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

export const useDeleteUpdateMutation = (username) => {
    return useMutation({
        mutationFn: postFunctions.deleteUserUpdates,
        onError: () => toast.error("The update could not be deleted"),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(["profile", username], (oldData) => {
                return {
                    ...oldData,
                    user_updates: [ ...oldData.user_updates.filter(u => u.id !== variables.updateIds), data ],
                };
            });
            toast.success("Update successfully deleted");
        }
    })
};

export const useDeleteHistoryMutation = (mediaType, mediaId) => {
    return useMutation({
        mutationFn: postFunctions.deleteUserUpdates,
        onError: () => toast.error("The update could not be deleted"),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(["details", mediaType, mediaId.toString()], (oldData) => {
                return {
                    ...oldData,
                    user_data: {
                        ...oldData.user_data,
                        history: [...oldData.user_data.history.filter(h => h.id !== variables.updateIds)],
                    },
                };
            });
            toast.success("Update successfully deleted");
        }
    })
};

export const useRefreshMutation = (mediaType, mediaId) => {
    return useMutation({
        mutationFn: () => postFunctions.updateMediaDetails({ mediaType, mediaId }),
        onError: () => toast.error("An error occurred while updating the mediadata"),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["details", mediaType, mediaId.toString()] });
            toast.success("Mediadata successfully updated");
        }
    })
};

export const useAddMediaToUser = (mediaType, mediaId) => {
    return useMutation({
        mutationFn: () => postFunctions.addMediaToUser({ mediaType, mediaId }),
        onError: () => toast.error("Failed to add the media to your list"),
        onSuccess: (data) => {
            queryClient.setQueryData(["details", mediaType, mediaId.toString()], (oldData) => {
                return { ...oldData, user_data: data };
            });
            toast.success("Media added to your list");
        }
    })
};

export const useRemoveMediaFromUser = (mediaType, mediaId) => {
    return useMutation({
        mutationFn: () => postFunctions.removeMediaFromUser({ mediaType, mediaId }),
        onError: () => toast.error("An error occurred while removing the media from your list"),
        onSuccess: () => {
            queryClient.setQueryData(["details", mediaType, mediaId.toString()], (oldData) => {
                return { ...oldData, user_data: false };
            });
            toast.success("Media removed from your list");
        }
    })
};

export const useUpdateUserMedia = (url, mediaType, mediaId, onSuccessHandler) => {
    return useMutation({
        mutationFn: ({ payload }) => postFunctions.updateUserMedia({ url, mediaType, mediaId, payload }),
        onError: () => toast.error("The info could not be updated"),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(["details", mediaType, mediaId.toString()], (oldData) => {
                return onSuccessHandler(oldData, variables);
            });
        },
    });
};

export const useResetPasswordMutation = (token) => {
    const navigate = useNavigate();
    return useMutation({
        mutationFn: ({ newPassword }) => postFunctions.resetPassword({ token, newPassword }),
        onError: () => toast.error("An error occurred while resetting your password"),
        onSuccess: () => {
            toast.success("Your password was successfully modified");
            return navigate({ to: "/" });
        },
    });
};

export const useRegisterTokenMutation = () => {
    const navigate = useNavigate();
    return useMutation({
        mutationFn: postFunctions.registerToken,
        onError: () => toast.error("An error occurred during registration."),
        onSuccess: async () => {
            toast.success("Your account has been successfully activated. Feel free to log in now.");
            await navigate({ to: "/" });
        },
    });
};

export const useForgotPasswordMutation = (errorCallback) => {
    const navigate = useNavigate();
    return useMutation({
        mutationFn: postFunctions.forgotPassword,
        onError: (error) => errorCallback(error.message),
        onSuccess: async() => {
            toast.success("A reset email has been sent to change your password");
            await navigate({ to :"/" });
        },
    });
};

export const useRemoveMediaFromList = (mediaType, mediaId, username, search) => {
    return useMutation({
        mutationFn: () => postFunctions.removeMediaFromUser({ mediaType, mediaId }),
        onError: () => toast.error("Failed to remove the media from your list"),
        onSuccess: () => {
            queryClient.setQueryData(["userList", mediaType, username, search], (oldData) => {
                return { ...oldData, media_data: [...oldData.media_data.filter(m => m.media_id !== mediaId)] };
            });
            toast.success("Media removed from your list");
        }
    })
};

export const useUpdateUserMediaList = (url, mediaType, mediaId, username, search, onSuccessHandler) => {
    return useMutation({
        mutationFn: ({ payload }) => postFunctions.updateUserMedia({ url, mediaType, mediaId, payload }),
        onError: () => toast.error("Failed to update the media"),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(["userList", mediaType, username, search], (oldData) => {
                return onSuccessHandler(oldData, variables);
            });
        },
    });
};

export const useAddMediaToUserList = (mediaType, mediaId, username, search) => {
    return useMutation({
        mutationFn: ({ payload }) => postFunctions.addMediaToUser({ mediaType, mediaId, payload }),
        onError: () => toast.error("Failed to add the media to your list"),
        onSuccess: () => {
            queryClient.setQueryData(["userList", mediaType, username, search], (oldData) => {
                const newData = { ...oldData };
                newData.media_data = newData.media_data.map(m => {
                    if (m.media_id === mediaId) {
                        return { ...m, common: true };
                    }
                    return m;
                });
                return newData;
            });
            toast.success("Media added to your list");
        }
    })
};

export const useAddLabelMutation = (url, mediaType, mediaId) => {
    return useMutation({
        mutationFn: ({ payload }) => postFunctions.updateUserMedia({
            url, mediaType, mediaId, payload
        }),
    })
};

export const useRenameLabelMutation = (mediaType) => {
    return useMutation({
        mutationFn: ({ oldName, newName }) => postFunctions.renameLabel({ mediaType, oldName, newName }),
    })
};

export const useDeleteLabelMutation = (mediaType) => {
    return useMutation({
        mutationFn: ({ name }) => postFunctions.deleteLabel({ mediaType, name }),
    })
};

export const useRemoveLabelMutation = (url, mediaType, mediaId) => {
    return useMutation({
        mutationFn: ({ payload }) => postFunctions.updateUserMedia({ url, mediaType, mediaId, payload }),
    })
};

export const useModalMutation = () => {
    const { setCurrentUser } = useUser();
    return useMutation({
        mutationFn: () => postFunctions.updateModal(),
        onError: () => toast.error("An error occurred while updating your preference"),
        onSuccess: () => {
            toast.success("Preference successfully updated");
            setCurrentUser((prev) => ({ ...prev, show_update_modal: false }));
        },
    });
};
