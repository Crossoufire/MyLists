import {useMutation, useQueryClient} from "@tanstack/react-query";
import {LabelAction, MediaType, Status} from "@/lib/server/utils/enums";
import {queryKeys} from "@/lib/react-query/query-options/query-options";
import {HistoryOptionsType, Label, MediaDetailsOptionsType, MediaListOptionsType, ProfileOptionsType, UserMedia} from "@/lib/components/types";
import {postAddMediaToList, postDeleteUserUpdates, postEditUserLabel, postRemoveMediaFromList, postUpdateUserMedia} from "@/lib/server/functions/user-media";


const deleteUpdatesKeys = [queryKeys.profileKey, queryKeys.allUpdatesKey, queryKeys.historyKey] as const;
export type DeleteUpdatesKeys = ReturnType<(typeof deleteUpdatesKeys)[number]>;

const detailsUserListKeys = [queryKeys.detailsKey, queryKeys.userListKey] as const
export type DetailsUserListKeys = ReturnType<(typeof detailsUserListKeys)[number]>;


export const useDeleteUpdatesMutation = (queryKey: DeleteUpdatesKeys) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ updateIds, returnData = false }: { updateIds: number[], returnData?: boolean }) => {
            return postDeleteUserUpdates({ data: { updateIds, returnData } })
        },
        meta: { errorMessage: "The update(s) could not be deleted" },
        onSuccess: async (data, variables) => {
            if (queryKey[0] === "profile") {
                return queryClient.setQueryData<ProfileOptionsType>(queryKey, (oldData) => {
                    if (!oldData || !data) return;
                    return {
                        ...oldData,
                        userUpdates: [...oldData.userUpdates.filter((up) => up.id !== variables.updateIds[0]), data],
                    }
                });
            }
            else if (queryKey[0] === "allUpdates") {
                await queryClient.invalidateQueries({ queryKey });
            }
            else if (queryKey[0] === "onOpenHistory") {
                return queryClient.setQueryData<HistoryOptionsType>(queryKey, (oldData) => {
                    if (!oldData) return;
                    return [...oldData.filter((history) => history.id !== variables.updateIds[0])];
                });
            }
        },
    });
};


export const useAddMediaToListMutation = (mediaType: MediaType, mediaId: number | string, queryKey: DetailsUserListKeys) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ status }: { status?: Status }) => {
            return postAddMediaToList({ data: { mediaId: mediaId, mediaType, status } })
        },
        meta: {
            successMessage: `${mediaType} added to your list`,
            errorMessage: `Failed to add this ${mediaType} to your list`,
        },
        onSuccess: (data) => {
            if (queryKey[0] === "details") {
                queryClient.setQueryData<MediaDetailsOptionsType>(queryKey, (oldData) => {
                    if (!oldData || !data) return;
                    return { ...oldData, userMedia: data as UserMedia };
                });
            }
            else if (queryKey[0] === "userList") {
                queryClient.setQueryData<MediaListOptionsType>(queryKey, (oldData) => {
                    if (!oldData) return;
                    return {
                        ...oldData,
                        results: {
                            ...oldData.results,
                            items: oldData.results.items.map((media: any) => (
                                media.mediaId === mediaId ? { ...media, common: true } : media),
                            )
                        },
                    };
                });
            }
        }
    });
};


export const useRemoveMediaFromListMutation = (mediaType: MediaType, mediaId: number | string, queryKey: DetailsUserListKeys) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => postRemoveMediaFromList({ data: { mediaId, mediaType } }),
        meta: { errorMessage: "Failed to remove this media from your list" },
        onSuccess: () => {
            if (queryKey[0] === "details") {
                queryClient.setQueryData<MediaDetailsOptionsType>(queryKey, (oldData) => {
                    if (!oldData) return;
                    return { ...oldData, userMedia: null };
                });
            }
            else if (queryKey[0] === "userList") {
                queryClient.setQueryData<MediaListOptionsType>(queryKey, (oldData) => {
                    if (!oldData) return;
                    return {
                        ...oldData,
                        results: {
                            ...oldData.results,
                            items: [...oldData.results.items.filter((media) => media.mediaId !== mediaId)] as any,
                        },
                    };
                })
            }
        }
    });
};


export const useUpdateUserMediaMutation = (mediaType: MediaType, mediaId: number, queryKey: DetailsUserListKeys) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ payload }: { payload: Record<string, any> }) => {
            return postUpdateUserMedia({ data: { mediaType, mediaId, payload } });
        },
        meta: { errorMessage: "Failed to update this field value. Please try again later." },
        onSuccess: (data) => {
            if (queryKey[0] === "details") {
                queryClient.setQueryData<MediaDetailsOptionsType>(queryKey, (oldData) => {
                    if (!oldData) return;
                    return { ...oldData, userMedia: { ...oldData.userMedia, ...data as UserMedia } };
                })
            }
            else if (queryKey[0] === "userList") {
                queryClient.setQueryData<MediaListOptionsType>(queryKey, (oldData) => {
                    if (!oldData) return;
                    return {
                        ...oldData,
                        results: {
                            ...oldData.results,
                            items: oldData.results.items.map((userMedia: any) => {
                                return userMedia.mediaId === mediaId ? { ...userMedia, ...data } : userMedia
                            }),
                        }
                    };
                });
            }
        },
    });
};


export const useEditUserLabelMutation = (mediaType: MediaType, mediaId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ label, action }: { label: Label, action: LabelAction }) => {
            return postEditUserLabel({ data: { mediaType, mediaId, label, action } });
        },
        meta: { errorMessage: "Failed to edit this label" },
        onSuccess: (data, variables) => {
            queryClient.setQueryData<(Label | undefined)[]>(queryKeys.labelsKey(mediaType), (oldData) => {
                if (!oldData) return;

                if (variables.action === "add") {
                    return oldData.map(l => l?.name).includes(data?.name) ? oldData : [...oldData, data];
                }
                else if (variables.action === "rename") {
                    return oldData.map(l => l?.name === variables.label.oldName ? data : l);
                }
                else if (variables.action === "deleteAll") {
                    return oldData.filter(l => l?.name !== variables.label.name);
                }
            });
        }
    })
};
