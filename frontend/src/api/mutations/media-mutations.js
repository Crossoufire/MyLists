import {postFetcher} from "@/api";
import {useMutation, useQueryClient} from "@tanstack/react-query";


const mediaUrls = {
    refreshDetails: () => "/details/refresh",
    editDetails: () => "/details/edit",
};


export const useRefreshMutation = (queryKey) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ mediaType, mediaId }) =>
            postFetcher({
                url: mediaUrls.refreshDetails(),
                data: { media_type: mediaType, media_id: mediaId },
            }),
        onSuccess: async () => await queryClient.invalidateQueries({ queryKey }),
    });
};


export const useEditMediaMutation = () => {
    return useMutation({
        mutationFn: ({ mediaType, mediaId, payload }) =>
            postFetcher({
                url: mediaUrls.editDetails(),
                data: { media_id: mediaId, media_type: mediaType, payload },
            }),
    });
};
