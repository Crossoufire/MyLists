import {MediaType} from "@/lib/server/utils/enums";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {queryKeys} from "@/lib/react-query/query-options/query-options";
import {postEditMediaDetails, refreshMediaDetails} from "@/lib/server/functions/media-details";


export const useRefreshMediaMutation = (mediaType: MediaType, mediaId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ mediaType, apiId }: { mediaType: MediaType, apiId: number }) => {
            return refreshMediaDetails({ data: { mediaType, apiId } });
        },
        onSuccess: async () => {
            return queryClient.invalidateQueries({ queryKey: queryKeys.detailsKey(mediaType, mediaId) });
        },
    });
};


export const useEditMediaMutation = () => {
    return useMutation({
        mutationFn: ({ mediaType, mediaId, payload }: { mediaType: MediaType, mediaId: number, payload: Record<string, any> }) => {
            return postEditMediaDetails({ data: { mediaType, mediaId, payload } })
        },
    });
};
