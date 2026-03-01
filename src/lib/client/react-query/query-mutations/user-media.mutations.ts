import {MediaType, TagAction} from "@/lib/utils/enums";
import {SearchType} from "@/lib/types/zod.schema.types";
import {Tag, UpdatePayload} from "@/lib/types/base.types";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {postAddMediaToList, postDeleteUserUpdates, postEditUserTag, postRemoveMediaFromList, postUpdateUserMedia} from "@/lib/server/functions/user-media";
import {
    allUpdatesOptions,
    historyOptions,
    mediaDetailsOptions,
    mediaListOptions,
    profileOptions,
    tagNamesOptions,
    tagsViewOptions
} from "@/lib/client/react-query/query-options/query-options";
import {useAuth} from "@/lib/client/hooks/use-auth";


export type UserMediaQueryOption = ReturnType<typeof mediaDetailsOptions> | ReturnType<typeof mediaListOptions>;


export const useDeleteProfileUpdateMutation = (username: string) => {
    const queryClient = useQueryClient();
    const queryKey = profileOptions(username).queryKey;

    return useMutation({
        mutationFn: postDeleteUserUpdates,
        meta: { errorMessage: "The update could not be deleted" },
        onSuccess: (data, variables) => {
            queryClient.setQueryData(queryKey, (oldData) => {
                if (!oldData || !data) return;
                return {
                    ...oldData,
                    userUpdates: [...oldData.userUpdates.filter((up) => up.id !== variables.data.updateIds[0]), data],
                };
            });
        },
    });
};


export const useDeleteAllUpdatesMutation = (username: string, filters: SearchType) => {
    const queryClient = useQueryClient();
    const queryKey = allUpdatesOptions(username, filters).queryKey;

    return useMutation({
        mutationFn: postDeleteUserUpdates,
        meta: { errorMessage: "The update could not be deleted" },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey });
        },
    });
};


export const useDeleteHistoryUpdatesMutation = (mediaType: MediaType, mediaId: number) => {
    const queryClient = useQueryClient();
    const queryKey = historyOptions(mediaType, mediaId).queryKey;

    return useMutation({
        mutationFn: postDeleteUserUpdates,
        meta: { errorMessage: "The update(s) could not be deleted" },
        onSuccess: async (_data, variables) => {
            return queryClient.setQueryData(queryKey, (oldData) => {
                if (!oldData) return;
                return [...oldData.filter((history) => history.id !== variables.data.updateIds[0])];
            });
        },
    });
};


export const useAddMediaToListMutation = (queryOption: UserMediaQueryOption) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postAddMediaToList,
        meta: {
            successMessage: "Media added to your list",
            errorMessage: "Failed to add this media to your list",
        },
        onSuccess: (data, variables) => {
            if (queryOption.queryKey[0] === "details") {
                queryClient.setQueryData(queryOption.queryKey, (oldData) => {
                    if (!oldData || !data) return;
                    return Object.assign({}, oldData, { userMedia: data });
                });
            }
            else if (queryOption.queryKey[0] === "userList") {
                queryClient.setQueryData(queryOption.queryKey, (oldData) => {
                    if (!oldData) return;
                    return {
                        ...oldData,
                        results: Object.assign({}, oldData.results, {
                            items: oldData.results.items.map((m) =>
                                m.mediaId === variables.data.mediaId ? Object.assign({}, m, { common: true }) : m
                            )
                        }),
                    };
                });
            }
        }
    });
};


export const useRemoveMediaFromListMutation = (queryOption: UserMediaQueryOption) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postRemoveMediaFromList,
        meta: { errorMessage: "Failed to remove this media from your list" },
        onSuccess: (_data, variables) => {
            if (queryOption.queryKey[0] === "details") {
                queryClient.setQueryData(queryOption.queryKey, (oldData) => {
                    if (!oldData) return;
                    return { ...oldData, userMedia: null };
                });
            }
            else if (queryOption.queryKey[0] === "userList") {
                queryClient.setQueryData(queryOption.queryKey, (oldData) => {
                    if (!oldData) return;
                    return {
                        ...oldData,
                        results: Object.assign({}, oldData.results, {
                            items: [...oldData.results.items.filter((m) => m.mediaId !== variables.data.mediaId)]
                        }),
                    };
                })
            }
        }
    });
};


export const useUpdateUserMediaMutation = (mediaType: MediaType, mediaId: number, queryOption: UserMediaQueryOption) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ payload }: UpdatePayload) => postUpdateUserMedia({ data: { payload, mediaType, mediaId } }),
        meta: { errorMessage: "Failed to update this field value. Please try again later." },
        onSuccess: (data) => {
            if (queryOption.queryKey[0] === "details") {
                queryClient.setQueryData(queryOption.queryKey, (oldData) => {
                    if (!oldData) return;
                    return { ...oldData, userMedia: { ...oldData.userMedia, ...data } };
                })
            }
            else if (queryOption.queryKey[0] === "userList") {
                queryClient.setQueryData(queryOption.queryKey, (oldData) => {
                    if (!oldData) return;
                    return {
                        ...oldData,
                        results: {
                            ...oldData.results,
                            items: oldData.results.items.map((userMedia) => {
                                return userMedia.mediaId === mediaId ? { ...userMedia, ...data } : userMedia
                            }),
                        }
                    };
                });
            }
        },
    });
};


export const useEditTagMutation = (mediaType: MediaType, mediaId?: number) => {
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ tag, action }: { tag: Tag, action: TagAction }) => {
            return postEditUserTag({ data: { mediaType, mediaId, tag, action } });
        },
        onSuccess: async (data) => {
            await queryClient.invalidateQueries({ queryKey: tagsViewOptions(mediaType, currentUser!.name).queryKey });

            queryClient.setQueryData(tagNamesOptions(mediaType, false).queryKey, (oldData) => {
                if (!oldData || !data) return;
                return oldData.map((c) => c?.name).includes(data?.name ?? "") ? oldData : [...oldData, data];
            });
        }
    })
};
