import {MediaType} from "@/lib/utils/enums";
import {ProviderSearchResult} from "@/lib/types/provider.types";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {mediaDetailsOptions} from "@/lib/client/react-query/query-options/query-options";
import {getMediaDetails, postEditMediaDetails, postUpdateBookCover, refreshMediaDetails} from "@/lib/server/functions/media-details";


export const useRefreshMediaMutation = (mediaType: MediaType, mediaOrApiId: number | string, external: boolean) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: refreshMediaDetails,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: mediaDetailsOptions(mediaType, mediaOrApiId.toString(), external).queryKey });
        },
    });
};


export const useEditMediaMutation = () => {
    return useMutation({ mutationFn: postEditMediaDetails });
};


export const useUpdateBookCoverMutation = (mediaOrApiId: number | string, external: boolean) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postUpdateBookCover,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: mediaDetailsOptions(MediaType.BOOKS, mediaOrApiId.toString(), external).queryKey });
        },
    });
};


export const useAddMediaToCollectionMutation = (mediaType: MediaType) => {
    return useMutation({
        mutationFn: (item: ProviderSearchResult) => {
            return getMediaDetails({ data: { mediaType, external: true, mediaId: item.id } });
        },
    });
};
