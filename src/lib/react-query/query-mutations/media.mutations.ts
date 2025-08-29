import {MediaType} from "@/lib/server/utils/enums";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {queryKeys} from "@/lib/react-query/query-options/query-options";
import {postEditMediaDetails, refreshMediaDetails} from "@/lib/server/functions/media-details";


export const useRefreshMediaMutation = (mediaType: MediaType, mediaOrApiId: number | string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: refreshMediaDetails,
        onSuccess: async () => {
            return queryClient.invalidateQueries({ queryKey: queryKeys.detailsKey(mediaType, mediaOrApiId.toString()) });
        },
    });
};


export const useEditMediaMutation = () => {
    return useMutation({ mutationFn: postEditMediaDetails });
};
