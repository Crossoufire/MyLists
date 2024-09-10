import {toast} from "sonner";
import {postFetcher} from "@/api/fetcher";
import {queryClient} from "@/api/queryClient";
import {useMutation} from "@tanstack/react-query";


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

export const mutationFunctionsMap = {
    addMediaToUser: ({ mediaType, mediaId, payload }) => postFetcher({
        url: "/add_media", data: { media_id: mediaId, media_type: mediaType, payload },
    }),
    removeMediaFromUser: ({ mediaType, mediaId }) => postFetcher({
        url: "/delete_media", data: { media_id: mediaId, media_type: mediaType },
    }),
    updateUserMedia: ({ url, mediaType, mediaId, payload }) => postFetcher({
        url: `/${url}`, data: { media_id: mediaId, media_type: mediaType, payload },
    }),
};

export const userMediaMutations = (mediaType, mediaId, queryKey) => {
    const updateRating = createMediaMutation("update_rating", mediaType, mediaId, queryKey);
    const updateComment = createMediaMutation("update_comment", mediaType, mediaId, queryKey);
    const updateFavorite = createMediaMutation("update_favorite", mediaType, mediaId, queryKey);
    const updateRedo = createMediaMutation("update_redo", mediaType, mediaId, queryKey);
    const updatePlaytime = createMediaMutation("update_playtime", mediaType, mediaId, queryKey);
    const updatePage = createMediaMutation("update_page", mediaType, mediaId, queryKey);
    const updatePlatform = createMediaMutation("update_platform", mediaType, mediaId, queryKey);
    const updateSeason = createMediaMutation("update_season", mediaType, mediaId, queryKey);
    const updateEpisode = createMediaMutation("update_episode", mediaType, mediaId, queryKey);
    const addToList = useAddMediaToList(mediaType, mediaId, queryKey);
    const removeFromList = useRemoveFromList(mediaType, mediaId, queryKey);
    const updateStatusFunc = (onSuccessHandler) => useUpdateStatus(mediaType, mediaId, queryKey, onSuccessHandler);

    return {
        updateRating, updateComment, updateFavorite, updateRedo, updatePlaytime, updatePage, updatePlatform,
        updateSeason, updateEpisode, addToList, removeFromList, updateStatusFunc
    };
};

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
