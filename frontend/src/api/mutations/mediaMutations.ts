import {toast} from "sonner";
import {postFetcher} from "@/api/fetcher";
import {queryClient} from "@/api/queryClient";
import {useMutation} from "@tanstack/react-query";
import {MediaType, UserMediaParams} from "@/utils/types.tsx";


interface MutationPayload {
    payload: string | boolean | undefined;
}


interface UpdateMediaMap {
    update_playtime: (media: UserMediaParams, value: number) => UserMediaParams;
    update_rating: (media: UserMediaParams, value: number) => UserMediaParams;
    update_comment: (media: UserMediaParams, value: string) => UserMediaParams;
    update_episode: (media: UserMediaParams, value: number) => UserMediaParams;
    update_platform: (media: UserMediaParams, value: string) => UserMediaParams;
    update_redo: (media: UserMediaParams, value: number) => UserMediaParams;
    update_page: (media: UserMediaParams, value: number) => UserMediaParams;
    update_favorite: (media: UserMediaParams, value: boolean) => UserMediaParams;
    update_season: (media: UserMediaParams, value: number) => UserMediaParams;
}


interface MutationFunctionsMap {
    removeMediaFromUser: (params: { mediaType: MediaType; mediaId: number }) => Promise<any>;
    addMediaToUser: (params: { mediaType: MediaType; mediaId: number; payload: any }) => Promise<any>;
    updateUserMedia: (params: { url: string; mediaType: MediaType; mediaId: number; payload: any }) => Promise<any>;
}


const updateMediaMap: UpdateMediaMap = {
    update_redo: (media, value) => ({...media, redo: value}),
    update_page: (media, value) => ({...media, page: value}),
    update_comment: (media, value) => ({...media, comment: value}),
    update_playtime: (media, value) => ({...media, playtime: value}),
    update_favorite: (media, value) => ({...media, favorite: value}),
    update_platform: (media, value) => ({...media, platform: value}),
    update_episode: (media, value) => ({...media, last_episode_watched: value}),
    update_rating: (media, value) => ({...media, rating: {...media.rating, value: value}}),
    update_season: (media, value) => ({...media, current_season: value, last_episode_watched: 1}),
};


export const mutationFunctionsMap: MutationFunctionsMap = {
    addMediaToUser: ({mediaType, mediaId, payload}) => postFetcher({
        url: "/add_media", data: {media_id: mediaId, media_type: mediaType, payload},
    }),
    removeMediaFromUser: ({mediaType, mediaId}) => postFetcher({
        url: "/delete_media", data: {media_id: mediaId, media_type: mediaType},
    }),
    updateUserMedia: ({url, mediaType, mediaId, payload}) => postFetcher({
        url: `/${url}`, data: {media_id: mediaId, media_type: mediaType, payload},
    }),
};


export const userMediaMutations = (mediaType: MediaType, mediaId: number, queryKey: Array<any>) => {
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
    const updateStatusFunc = (onSuccessHandler: (oldData: any, variables: any) => void) => {
        return useUpdateStatus(mediaType, mediaId, queryKey, onSuccessHandler);
    };

    return {
        updateRating, updateComment, updateFavorite, updateRedo, updatePlaytime, updatePage, updatePlatform,
        updateSeason, updateEpisode, addToList, removeFromList, updateStatusFunc,
    };
};


const createMediaMutation = (url: string, mediaType: MediaType, mediaId: number, queryKey: Array<any>) => {
    return useMutation({
        mutationFn: ({payload}: MutationPayload) => mutationFunctionsMap.updateUserMedia({url, mediaType, mediaId, payload}),
        onError: () => toast.error(`Failed to update the ${url.replace("update_", "")} value`),
        onSuccess: (data, variables) => {
            const updateFn = updateMediaMap[url];
            queryClient.setQueryData(queryKey, (oldData) => {
                if (queryKey[0] === "details") {
                    return {...oldData, user_media: updateFn(oldData.user_media, variables.payload)};
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


const useUpdateStatus = (mediaType: MediaType, mediaId: number, queryKey: Array<any>, onSuccess: (oldData: any, variables: any) => void) => {
    return useMutation({
        mutationFn: ({payload}: MutationPayload) => mutationFunctionsMap.updateUserMedia({
            url: "update_status", mediaType, mediaId, payload
        }),
        onError: () => toast.error("Failed to update the status value"),
        onSuccess: (data, variables) => {
            queryClient.setQueryData(queryKey, (oldData) => onSuccess(oldData, variables));
        },
    });
};


const useRemoveFromList = (mediaType: MediaType, mediaId: number, queryKey: Array<any>) => {
    return useMutation({
        mutationFn: () => mutationFunctionsMap.removeMediaFromUser({mediaType, mediaId}),
        onError: () => toast.error("Failed to remove the media from your list"),
        onSuccess: () => {
            toast.success("Media removed from your list");
            queryClient.setQueryData(queryKey, (oldData) => {
                if (queryKey[0] === "details") {
                    return {...oldData, user_media: false};
                }
                return {...oldData, media_data: [...oldData.media_data.filter(m => m.media_id !== mediaId)]};
            });
        }
    });
};


const useAddMediaToList = (mediaType: MediaType, mediaId: number, queryKey: Array<any>) => {
    return useMutation({
        mutationFn: ({payload}: MutationPayload) => mutationFunctionsMap.addMediaToUser({mediaType, mediaId, payload}),
        onError: () => toast.error("Failed to add the media to your list"),
        onSuccess: (data) => {
            toast.success("Media added to your list");
            queryClient.setQueryData(queryKey, (oldData) => {
                if (queryKey[0] === "details") {
                    return {...oldData, user_media: data};
                }
                return {
                    ...oldData,
                    media_data: [
                        ...oldData.media_data.map(m => {
                            if (m.media_id === mediaId) {
                                return {...m, common: true};
                            }
                            return m;
                        })
                    ]
                };
            });
        }
    });
};
