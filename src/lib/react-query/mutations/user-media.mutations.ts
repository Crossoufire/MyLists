import {queryKeys} from "@/lib/react-query/query-options";
import {MediaType, UpdateType} from "@/lib/server/utils/enums";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {postUpdateUserMedia} from "@/lib/server/functions/user-media";


export const useUpdateRedoMutation = (mediaType: MediaType, mediaId: number, queryKey: string[]) => {
    const queryClient = useQueryClient();

    return useMutation<void, Error, { payload: any }>({
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
