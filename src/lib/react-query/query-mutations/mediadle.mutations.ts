import {queryKeys} from "@/lib/react-query/query-options/query-options";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {postAddMediadleGuess} from "@/lib/server/functions/moviedle";


export const useMoviedleGuessMutation = () => {
    const queryClient = useQueryClient();

    return useMutation<any, Error, { guess: string }>({
        mutationFn: ({ guess }) => postAddMediadleGuess({ data: { guess } }),
        onSuccess: async () => {
            return queryClient.invalidateQueries({ queryKey: queryKeys.dailyMediadleKey() })
        },
    });
};
