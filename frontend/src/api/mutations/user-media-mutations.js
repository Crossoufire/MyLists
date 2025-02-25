import {postFetcher, queryKeys} from "@/api";
import {useMutation, useQueryClient} from "@tanstack/react-query";


const userMediaUrls = {
    deleteUserUpdates: () => "/delete_updates",
    deleteMediaFromList: () => "/delete_media",
    addMediaToUserList: () => "/add_media",

    // Labels
    addLabelToMedia: () => "/add_media_to_label",
    removeLabelFromMedia: () => "/remove_label_from_media",
    renameLabel: () => "/rename_label",
    deleteLabel: () => "/delete_label",

    // Common
    updateStatus: () => "/update_status",
    updateRedo: () => "/update_redo",
    updateComment: () => "/update_comment",
    updateFavorite: () => "/update_favorite",
    updateRating: () => "/update_rating",

    // Series and Anime
    updateSeason: () => "/update_season",
    updateEpisode: () => "/update_episode",
    updateRedoTv: () => "/update_redo_tv",

    // Games
    updatePlaytime: () => "/update_playtime",
    updatePlatform: () => "/update_platform",

    // Books
    updatePage: () => "/update_page",

    // Manga
    updateChapter: () => "/update_chapter",
};


// Key is backend url, value is payload
const updateUserMediaMap = {
    // Common
    [userMediaUrls.updateRedo()]: (media, value) => ({ ...media, redo: value }),
    [userMediaUrls.updateComment()]: (media, value) => ({ ...media, comment: value }),
    [userMediaUrls.updateFavorite()]: (media, value) => ({ ...media, favorite: value }),
    [userMediaUrls.updateRating()]: (media, value) => ({ ...media, rating: { ...media.rating, value: value } }),

    // Series and Anime
    [userMediaUrls.updateEpisode()]: (media, value) => ({ ...media, last_episode_watched: value }),
    [userMediaUrls.updateSeason()]: (media, value) => ({ ...media, current_season: value, last_episode_watched: 1 }),

    // Games
    [userMediaUrls.updatePlaytime()]: (media, value) => ({ ...media, playtime: value }),
    [userMediaUrls.updatePlatform()]: (media, value) => ({ ...media, platform: value }),

    // Books
    [userMediaUrls.updatePage()]: (media, value) => ({ ...media, page: value }),

    // Manga
    [userMediaUrls.updateChapter()]: (media, value) => ({ ...media, current_chapter: value }),
};


// Create different mutations for user media updates
const createUserMediaMutation = (url, mediaType, mediaId, queryKey) => {
    const queryClient = useQueryClient();

    if (!updateUserMediaMap[url]) {
        throw new Error(`url [${url}] not present in updateUserMediaMap.`);
    }

    return useMutation({
        mutationFn: ({ payload }) => postFetcher({
            url: url,
            data: { media_id: mediaId, media_type: mediaType, payload },
        }),
        meta: { errorMessage: `Failed to update the ${url.replace("update_", "")} value` },
        onSuccess: (data, variables) => {
            const updateFn = updateUserMediaMap[url];
            queryClient.setQueryData(queryKey, (oldData) => {
                if (queryKey[0] === queryKeys.detailsKey(undefined, undefined)[0]) {
                    return { ...oldData, user_media: updateFn(oldData.user_media, variables.payload) };
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


export const useDeleteUpdateMutation = (queryKey) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ updateIds, returnData = false }) =>
            postFetcher({
                url: userMediaUrls.deleteUserUpdates(),
                data: { update_ids: updateIds, return_data: returnData },
            }),
        meta: { errorMessage: "The update(s) could not be deleted" },
        onSuccess: async (data, variables) => {
            if (queryKey[0] === queryKeys.profileKey(undefined)[0]) {
                return queryClient.setQueryData(queryKey, (oldData) => ({
                    ...oldData,
                    user_updates: [...oldData.user_updates.filter(up => up.id !== variables.updateIds[0]), data],
                }));
            }
            else if (queryKey[0] === queryKeys.allUpdatesKey(undefined, undefined)[0]) {
                await queryClient.invalidateQueries({ queryKey });
            }
            else if (queryKey[0] === queryKeys.historyKey(undefined, undefined)[0]) {
                return queryClient.setQueryData(queryKey, (oldData) => {
                    return [...oldData.filter(hist => hist.id !== variables.updateIds[0])];
                });
            }
        },
    });
};


export const useUpdateStatusMutation = (mediaType, mediaId, queryKey, onSuccess) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ payload }) => postFetcher({
            url: userMediaUrls.updateStatus(),
            data: { media_id: mediaId, media_type: mediaType, payload },
        }),
        meta: { errorMessage: "Failed to update the status value" },
        onSuccess: (data, variables) => {
            queryClient.setQueryData(queryKey, (oldData) => onSuccess(oldData, variables));
        },
    });
};


export const useRemoveMediaFromListMutation = (mediaType, mediaId, queryKey) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => postFetcher({
            url: userMediaUrls.deleteMediaFromList(),
            data: { media_id: mediaId, media_type: mediaType },
        }),
        meta: { errorMessage: "Failed to remove this media from your list" },
        onSuccess: () => {
            queryClient.setQueryData(queryKey, (oldData) => {
                if (queryKey[0] === queryKeys.detailsKey(undefined, undefined)[0]) {
                    return { ...oldData, user_media: false };
                }
                return { ...oldData, media_data: [...oldData.media_data.filter(m => m.media_id !== mediaId)] };
            });
        }
    });
};


export const useAddMediaToListMutation = (mediaType, mediaId, queryKey) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ payload }) => postFetcher({
            url: userMediaUrls.addMediaToUserList(),
            data: { media_id: mediaId, media_type: mediaType, payload },
        }),
        meta: { errorMessage: "Failed to add this media to your list", successMessage: "Media added to your list" },
        onSuccess: (data) => {
            queryClient.setQueryData(queryKey, (oldData) => {
                if (queryKey[0] === queryKeys.detailsKey(undefined, undefined)[0]) {
                    return { ...oldData, user_media: data };
                }
                return {
                    ...oldData,
                    media_data: oldData.media_data.map(m => m.media_id === mediaId ? { ...m, common: true } : m),
                };
            });
        }
    });
};


export const useAddLabelMutation = (mediaType, mediaId) => {
    return useMutation({
        mutationFn: ({ payload }) => postFetcher({
            url: userMediaUrls.addLabelToMedia(),
            data: { media_id: mediaId, media_type: mediaType, payload },
        }),
    });
};


export const useRemoveLabelMutation = (mediaType, mediaId) => {
    return useMutation({
        mutationFn: ({ payload }) => postFetcher({
            url: userMediaUrls.removeLabelFromMedia(),
            data: { media_id: mediaId, media_type: mediaType, payload },
        }),
    });
};


export const useRenameLabelMutation = (mediaType) => {
    return useMutation({
        mutationFn: ({ oldName, newName }) => postFetcher({
            url: userMediaUrls.renameLabel(),
            data: { media_type: mediaType, old_label_name: oldName, new_label_name: newName },
        }),
    });
};


export const useDeleteLabelMutation = (mediaType) => {
    return useMutation({
        mutationFn: ({ name }) => postFetcher({
            url: userMediaUrls.deleteLabel(),
            data: { media_type: mediaType, name },
        }),
    });
};


export const useUserMediaMutations = (mediaType, mediaId, queryKey) => {
    // Common
    const updateRedo = createUserMediaMutation(userMediaUrls.updateRedo(), mediaType, mediaId, queryKey);
    const updateRating = createUserMediaMutation(userMediaUrls.updateRating(), mediaType, mediaId, queryKey);
    const updateComment = createUserMediaMutation(userMediaUrls.updateComment(), mediaType, mediaId, queryKey);
    const updateFavorite = createUserMediaMutation(userMediaUrls.updateFavorite(), mediaType, mediaId, queryKey);

    // Series and Anime
    const updateSeason = createUserMediaMutation(userMediaUrls.updateSeason(), mediaType, mediaId, queryKey);
    const updateEpisode = createUserMediaMutation(userMediaUrls.updateEpisode(), mediaType, mediaId, queryKey);

    // Games
    const updatePlaytime = createUserMediaMutation(userMediaUrls.updatePlaytime(), mediaType, mediaId, queryKey);
    const updatePlatform = createUserMediaMutation(userMediaUrls.updatePlatform(), mediaType, mediaId, queryKey);

    // Books
    const updatePage = createUserMediaMutation(userMediaUrls.updatePage(), mediaType, mediaId, queryKey);

    // Manga
    const updateChapter = createUserMediaMutation(userMediaUrls.updateChapter(), mediaType, mediaId, queryKey);

    return {
        updateRedo, updateRating, updateComment, updateFavorite, updateSeason, updateEpisode,
        updatePlaytime, updatePlatform, updatePage, updateChapter,
    };
};


export const useRedoTvMutation = (mediaType, mediaId) => {
    return useMutation({
        mutationFn: ({ payload }) => postFetcher({
            url: userMediaUrls.updateRedoTv(),
            data: { media_id: mediaId, media_type: mediaType, payload },
        }),
    });
};