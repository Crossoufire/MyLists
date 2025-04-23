import {queryKeys} from "@/lib/react-query/query-options";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {MediaType, Status, UpdateType} from "@/lib/server/utils/enums";
import {postAddMediaToList, postDeleteUserUpdates, postRemoveMediaFromList, postUpdateUserMedia} from "@/lib/server/functions/user-media";


export const useDeleteUpdatesMutation = (queryKey: string[]) => {
    const queryClient = useQueryClient();
    return useMutation<any, Error, { updateIds: number[], returnData?: boolean }>({
        mutationFn: ({ updateIds, returnData = false }) => postDeleteUserUpdates({ data: { updateIds, returnData } }),
        meta: { errorMessage: "The update(s) could not be deleted" },
        onSuccess: async (data, variables) => {
            //@ts-expect-error
            if (queryKey[0] === queryKeys.profileKey(undefined)[0]) {
                return queryClient.setQueryData(queryKey, (oldData: any) => ({
                    ...oldData,
                    userUpdates: [...oldData.userUpdates.filter((up: any) => up.id !== variables.updateIds[0]), data],
                }));
            }
            //@ts-expect-error
            else if (queryKey[0] === queryKeys.allUpdatesKey(undefined, undefined)[0]) {
                await queryClient.invalidateQueries({ queryKey });
            }
            //@ts-expect-error
            else if (queryKey[0] === queryKeys.historyKey(undefined, undefined)[0]) {
                return queryClient.setQueryData(queryKey, (oldData: any) => {
                    return [...oldData.filter((history: any) => history.id !== variables.updateIds[0])];
                });
            }
        },
    });
};

export const useAddMediaToListMutation = (mediaType: MediaType, mediaId: number | string, queryKey: string[]) => {
    const queryClient = useQueryClient();

    return useMutation<any, Error, { status?: Status }>({
        mutationFn: ({ status }) => {
            return postAddMediaToList({ data: { mediaId, mediaType, status } })
        },
        meta: {
            successMessage: `${mediaType} added to your list`,
            errorMessage: `Failed to add this ${mediaType} to your list`,
        },
        onSuccess: (data) => {
            queryClient.setQueryData(queryKey, (oldData: any) => {
                // @ts-expect-error
                if (queryKey[0] === queryKeys.detailsKey(undefined, undefined)[0]) {
                    return { ...oldData, userMedia: data };
                }
                return {
                    ...oldData,
                    mediaData: oldData.mediaData.map((media: any) => (
                        media.mediaId === mediaId ? { ...media, common: true } : media),
                    )
                };
            });
        }
    });
};

export const useRemoveMediaFromListMutation = (mediaType: MediaType, mediaId: number | string, queryKey: string[]) => {
    const queryClient = useQueryClient();

    return useMutation<any, Error, {}>({
        mutationFn: () => postRemoveMediaFromList({ data: { mediaId, mediaType } }),
        meta: { errorMessage: "Failed to remove this media from your list" },
        onSuccess: () => {
            queryClient.setQueryData(queryKey, (oldData: any) => {
                // @ts-expect-error
                if (queryKey[0] === queryKeys.detailsKey(undefined, undefined)[0]) {
                    const { userMedia, ...rest } = oldData;
                    return rest;
                }
                return {
                    ...oldData,
                    mediaData: [...oldData.mediaData.filter((media: any) => media.mediaId !== mediaId)],
                };
            });
        }
    });
};


// --- Media Update Mutations (status, favorite, comment, redo, etc...) ---------------------------------------


interface UpdateUserMediaMutationOptions {
    mediaId: number;
    queryKey: string[];
    mediaType: MediaType;
    fieldToUpdate: string;
    updateType?: UpdateType;
}


export const useUpdateUserMediaMutation = (data: UpdateUserMediaMutationOptions) => {
    const queryClient = useQueryClient();
    const { mediaType, mediaId, queryKey, fieldToUpdate, updateType } = data;

    // { payload: { redo: <valu> } }
    return useMutation<Record<string, any>, Error, { payload: Record<string, any> }>({
        mutationFn: ({ payload }) => {
            return postUpdateUserMedia({ data: { mediaType, mediaId, payload, updateType } });
        },
        meta: { errorMessage: `Failed to update the ${fieldToUpdate} value` },
        onSuccess: (data) => {
            // <data> contains all modifications necessary to update <userMedia>
            // Example: if `status` was updated for Movies it returns { status: the-new-status, redo: 0 }

            queryClient.setQueryData(queryKey, (oldData: Record<string, any>) => {
                // @ts-expect-error
                if (queryKey[0] === queryKeys.detailsKey(undefined, undefined)[0]) {
                    return { ...oldData, userMedia: { ...oldData.userMedia, ...data } };
                }

                // @ts-expect-error
                if (queryKey[0] === queryKeys.userListKey(undefined, undefined, undefined)[0]) {
                    return {
                        ...oldData,
                        items: oldData.items.map((userMedia: any) =>
                            userMedia.mediaId === mediaId ? { ...userMedia, ...data } : userMedia
                        ),
                    };
                }

                return oldData;
            });
        },
    });
};

export const useUpdateRedoMutation = (mediaType: MediaType, mediaId: number, queryKey: string[]) => {
    return useUpdateUserMediaMutation({ mediaType, mediaId, queryKey, fieldToUpdate: "redo", updateType: UpdateType.REDO });
};

export const useUpdateCommentMutation = (mediaType: MediaType, mediaId: number, queryKey: string[]) => {
    return useUpdateUserMediaMutation({ mediaType, mediaId, queryKey, fieldToUpdate: "comment" });
};

export const useUpdateFavoriteMutation = (mediaType: MediaType, mediaId: number, queryKey: string[]) => {
    return useUpdateUserMediaMutation({ mediaType, mediaId, queryKey, fieldToUpdate: "favorite" });
};

export const useUpdateStatusMutation = (mediaType: MediaType, mediaId: number, queryKey: string[]) => {
    return useUpdateUserMediaMutation({ mediaType, mediaId, queryKey, fieldToUpdate: "status", updateType: UpdateType.STATUS });
};
