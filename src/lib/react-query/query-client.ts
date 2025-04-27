import {toast} from "sonner";
import {MutationCache, QueryCache, QueryClient} from "@tanstack/react-query";


export const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError: (_error, query) => {
            if (query?.meta?.errorMessage) {
                toast.error(query.meta.errorMessage.toString());
            }
        },
    }),
    mutationCache: new MutationCache({
        onError: (_error, _variables, _context, mutation) => {
            if (mutation?.meta?.errorMessage) {
                toast.error(mutation.meta.errorMessage.toString());
            }
        },
        onSuccess: (_data, _variables, _context, mutation) => {
            if (mutation?.meta?.successMessage) {
                toast.success(mutation.meta.successMessage.toString());
            }
        }
    }),
    defaultOptions: {
        queries: {
            retry: false,
            staleTime: 2 * 1000,
            refetchOnWindowFocus: false,
        },
    },
});
