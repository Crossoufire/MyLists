import {toast} from "sonner";
import {MutationCache, QueryCache, QueryClient} from "@tanstack/react-query";


export const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError: async (error) => {
            toast.error(error.message ?? "An unexpected error occurred. Please try again later.")
        },
    }),
    mutationCache: new MutationCache({
        onError: (error) => {
            toast.error(error?.message ?? "An unexpected error occurred. Please try again later.")
        },
    }),
    defaultOptions: {
        queries: {
            retry: false,
            staleTime: 2 * 1000,
            refetchOnWindowFocus: false,
        },
    },
});
