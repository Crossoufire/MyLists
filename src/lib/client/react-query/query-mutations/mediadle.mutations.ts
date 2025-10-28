import {useMutation, useQueryClient} from "@tanstack/react-query";
import {postAddMediadleGuess} from "@/lib/server/functions/moviedle";
import {queryKeys} from "@/lib/client/react-query/query-options/query-options";


export const useMoviedleGuessMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postAddMediadleGuess,
        onSuccess: () => {
            return queryClient.invalidateQueries({ queryKey: queryKeys.dailyMediadleKey() });
        },
    });
};
