import {MediaType, Status} from "@/lib/server/utils/enums";
import {Label} from "@/lib/components/user-media/LabelsDialog";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {queryKeys} from "@/lib/react-query/query-options/query-options";
import {EditUserLabels} from "@/lib/server/domain/media/base/base.repository";
import {postAddMediaToList, postDeleteUserUpdates, postEditUserLabel, postRemoveMediaFromList, postUpdateUserMedia} from "@/lib/server/functions/user-media";


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
                    results: {
                        ...oldData.results,
                        items: oldData.results.items.map((media: any) => (
                            media.mediaId === mediaId ? { ...media, common: true } : media),
                        )
                    },
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
                    results: {
                        ...oldData.results,
                        items: [...oldData.results.items.filter((media: any) => media.mediaId !== mediaId)],
                    },
                };
            });
        }
    });
};


export const useUpdateUserMediaMutation = (mediaType: MediaType, mediaId: number, queryKey: string[]) => {
    const queryClient = useQueryClient();

    return useMutation<Record<string, any>, Error, { payload: Record<string, any> }>({
        mutationFn: ({ payload }) => {
            return postUpdateUserMedia({ data: { mediaType, mediaId, payload } });
        },
        meta: { errorMessage: "Failed to update this field value. Please try again later." },
        onSuccess: (data) => {
            queryClient.setQueryData(queryKey, (oldData: Record<string, any>) => {
                // @ts-expect-error
                if (queryKey[0] === queryKeys.detailsKey(undefined, undefined)[0]) {
                    return { ...oldData, userMedia: { ...oldData.userMedia, ...data } };
                }

                // @ts-expect-error
                if (queryKey[0] === queryKeys.userListKey(undefined, undefined, undefined)[0]) {
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

                return oldData;
            });
        },
    });
};


export const useEditUserLabelMutation = (mediaType: MediaType, mediaId: number) => {
    const queryClient = useQueryClient();

    return useMutation<any, Error, { label: Label, action: EditUserLabels["action"] }>({
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
