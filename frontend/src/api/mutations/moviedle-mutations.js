import {postFetcher, queryKeys} from "@/api";
import {useMutation, useQueryClient} from "@tanstack/react-query";


const moviedleUrls = {
    guess: () => "/daily-mediadle/guess",
};


export const useMoviedleGuessMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ guess }) => postFetcher({ url: moviedleUrls.guess(), data: { guess } }),
        onSuccess: async () => await queryClient.invalidateQueries({ queryKey: queryKeys.dailyMediadleKey() }),
    });
};