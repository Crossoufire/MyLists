import {Label} from "@/lib/components/types";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {LabelAction, MediaType, Status} from "@/lib/server/utils/enums";
import {queryKeys} from "@/lib/react-query/query-options/query-options";
import {postAddMediaToList, postDeleteUserUpdates, postEditUserLabel, postRemoveMediaFromList, postUpdateUserMedia} from "@/lib/server/functions/user-media";


const deleteUpdatesKeys = [queryKeys.profileKey, queryKeys.allUpdatesKey, queryKeys.historyKey] as const;
export type DeleteUpdatesKeys = ReturnType<(typeof deleteUpdatesKeys)[number]>;

const detailsUserListKeys = [queryKeys.detailsKey, queryKeys.userListKey] as const
export type DetailsUserListKeys = ReturnType<(typeof detailsUserListKeys)[number]>;


export const useDeleteUpdatesMutation = (queryKey: DeleteUpdatesKeys) => {
    const queryClient = useQueryClient();
    return useMutation<any, Error, { updateIds: number[], returnData?: boolean }>({
        mutationFn: ({ updateIds, returnData = false }) => postDeleteUserUpdates({ data: { updateIds, returnData } }),
        meta: { errorMessage: "The update(s) could not be deleted" },
        onSuccess: async (data, variables) => {
            if (queryKey[0] === "profile") {
                return queryClient.setQueryData(queryKey, (oldData: any) => ({
                    ...oldData,
                    userUpdates: [...oldData.userUpdates.filter((up: any) => up.id !== variables.updateIds[0]), data],
                }));
            }
            else if (queryKey[0] === "allUpdates") {
                await queryClient.invalidateQueries({ queryKey });
            }
            else if (queryKey[0] === "onOpenHistory") {
                return queryClient.setQueryData(queryKey, (oldData: any) => {
                    return [...oldData.filter((history: any) => history.id !== variables.updateIds[0])];
                });
            }
        },
    });
};


export const useAddMediaToListMutation = (mediaType: MediaType, mediaId: number | string, queryKey: DetailsUserListKeys) => {
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
                if (queryKey[0] === "details") {
                    return { ...oldData, userMedia: data };
                }
                else if (queryKey[0] === "userList") {
                    return {
                        ...oldData,
                        results: {
                            ...oldData.results,
                            items: oldData.results.items.map((media: any) => (
                                media.mediaId === mediaId ? { ...media, common: true } : media),
                            )
                        },
                    };
                }
            });
        }
    });
};


export const useRemoveMediaFromListMutation = (mediaType: MediaType, mediaId: number | string, queryKey: DetailsUserListKeys) => {
    const queryClient = useQueryClient();

    return useMutation<any, Error, {}>({
        mutationFn: () => postRemoveMediaFromList({ data: { mediaId, mediaType } }),
        meta: { errorMessage: "Failed to remove this media from your list" },
        onSuccess: () => {
            queryClient.setQueryData(queryKey, (oldData: any) => {
                if (queryKey[0] === "details") {
                    const { userMedia, ...rest } = oldData;
                    return rest;
                }
                else if (queryKey[0] === "userList") {
                    return {
                        ...oldData,
                        results: {
                            ...oldData.results,
                            items: [...oldData.results.items.filter((media: any) => media.mediaId !== mediaId)],
                        },
                    };
                }
            });
        }
    });
};


export const useUpdateUserMediaMutation = (mediaType: MediaType, mediaId: number, queryKey: DetailsUserListKeys) => {
    const queryClient = useQueryClient();

    return useMutation<Record<string, any>, Error, { payload: Record<string, any> }>({
        mutationFn: ({ payload }) => {
            return postUpdateUserMedia({ data: { mediaType, mediaId, payload } });
        },
        meta: { errorMessage: "Failed to update this field value. Please try again later." },
        onSuccess: (data) => {
            queryClient.setQueryData(queryKey, (oldData: Record<string, any>) => {
                if (queryKey[0] === "details") {
                    return { ...oldData, userMedia: { ...oldData.userMedia, ...data } };
                }
                else if (queryKey[0] === "userList") {
                    return {
                        ...oldData,
                        results: {
                            ...oldData.results,
                            items: oldData.results.items.map((userMedia: any) => {
                                return userMedia.mediaId === mediaId ? { ...userMedia, ...data } : userMedia
                            }),
                        }
                    };
                }
            });
        },
    });
};


export const useEditUserLabelMutation = (mediaType: MediaType, mediaId: number) => {
    const queryClient = useQueryClient();

    return useMutation<any, Error, { label: Label, action: LabelAction }>({
        mutationFn: ({ label, action }) => {
            return postEditUserLabel({ data: { mediaType, mediaId, label, action } });
        },
        meta: { errorMessage: "Failed to edit this label" },
        onSuccess: (data, variables) => {
            queryClient.setQueryData(queryKeys.labelsKey(mediaType), (oldData: Label[]) => {
                if (variables.action === "add") {
                    return oldData.map(l => l.name).includes(data.name) ? oldData : [...oldData, data];
                }
                else if (variables.action === "rename") {
                    return oldData.map(l => l.name === variables.label.oldName ? data : l);
                }
                else if (variables.action === "deleteAll") {
                    return oldData.filter(l => l.name !== variables.label.name);
                }
            });
        }
    })
};
