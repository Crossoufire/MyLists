import {MediaType} from "@/lib/utils/enums";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {mediaDetailsOptions} from "@/lib/client/react-query/query-options/query-options";
import {postEditMediaDetails, refreshMediaDetails} from "@/lib/server/functions/media-details";


export const useRefreshMediaMutation = (mediaType: MediaType, mediaOrApiId: number | string, external: boolean) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: refreshMediaDetails,
        onSuccess: async () => {
            return queryClient.invalidateQueries({ queryKey: mediaDetailsOptions(mediaType, mediaOrApiId.toString(), external).queryKey });
        },
    });
};


export const useEditMediaMutation = () => {
    return useMutation({ mutationFn: postEditMediaDetails });
};
