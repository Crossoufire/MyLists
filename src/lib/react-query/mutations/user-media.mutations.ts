import {queryKeys} from "@/lib/react-query/query-options";
import {MediaType, UpdateType} from "@/lib/server/utils/enums";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {postDeleteUserUpdates, postUpdateUserMedia} from "@/lib/server/functions/user-media";


export const useUpdateRedoMutation = (mediaType: MediaType, mediaId: number, queryKey: string[]) => {
    const queryClient = useQueryClient();

    return useMutation<void, Error, { payload: Record<string, any> }>({
        mutationFn: ({ payload }) => {
            return postUpdateUserMedia({ data: { mediaType, mediaId, payload, updateType: UpdateType.REDO } })
        },
        onSuccess: (_data, variables) => {
            queryClient.setQueryData(queryKey, (oldData: any) => {
                //@ts-expect-error
                if (queryKey[0] === queryKeys.detailsKey(undefined, undefined)[0]) {
                    return { ...oldData, userMedia: { ...oldData.userMedia, redo: variables.payload } };
                }
                return {
                    ...oldData,
                    mediaData: oldData.mediaData.map((media: any) =>
                        media.mediaId === mediaId ? { ...media, redo: variables.payload } : media,
                    )
                };
            });
        },
    });
}


export const useDeleteUpdatesMutation = (queryKey: string[]) => {
    const queryClient = useQueryClient();
    return useMutation<any, Error, { updateIds: number[], returnData: boolean }>({
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
                    return [...oldData.filter((hist: any) => hist.id !== variables.updateIds[0])];
                });
            }
        },
    });
};
