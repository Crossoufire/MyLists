import {MediaType} from "@/lib/server/utils/enums";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {refreshMediaDetails} from "@/lib/server/functions/media-details";


export const useRefreshMediaMutation = (queryKey: string[]) => {
    const queryClient = useQueryClient();

    return useMutation<any, Error, { mediaType: MediaType, apiId: number }>({
        mutationFn: ({ mediaType, apiId }) => refreshMediaDetails({ data: { mediaType, apiId } }),
        onSuccess: async () => await queryClient.invalidateQueries({ queryKey }),
    });
};
