import {MediaType} from "@/lib/server/utils/enums";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {queryKeys} from "@/lib/react-query/query-options/query-options";
import {postEditMediaDetails, refreshMediaDetails} from "@/lib/server/functions/media-details";


export const useRefreshMediaMutation = (mediaType: MediaType, mediaId: number) => {
    const queryClient = useQueryClient();

    return useMutation<any, Error, { mediaType: MediaType, apiId: number }>({
        mutationFn: ({ mediaType, apiId }) => refreshMediaDetails({ data: { mediaType, apiId } }),
        onSuccess: async () => await queryClient.invalidateQueries({ queryKey: queryKeys.detailsKey(mediaType, mediaId.toString()) }),
    });
};


export const useEditMediaMutation = () => {
    return useMutation<any, Error, { mediaType: MediaType, mediaId: number, payload: Record<string, any> }>({
        mutationFn: ({ mediaType, mediaId, payload }) => postEditMediaDetails({ data: { mediaType, mediaId, payload } }),
    });
};
