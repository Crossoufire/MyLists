import {toast} from "sonner";
import {MutationCache, QueryCache, QueryClient} from "@tanstack/react-query";


export const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError: (error, query) => {
            if (query?.meta?.errorMessage) {
                toast.error(query.meta.errorMessage);
            }
        },
    }),
    mutationCache: new MutationCache({
        onError: (_error, _variables, _context, mutation) => {
            if (mutation?.meta?.errorMessage) {
                toast.error(mutation.meta.errorMessage);
            }
        },
        onSuccess: (_data, _variables, _context, mutation) => {
            if (mutation?.meta?.successMessage) {
                toast.success(mutation.meta.successMessage);
            }
        }
    }),
    defaultOptions: {
        queries: {
            retry: false,
            staleTime: 2000,
            refetchOnWindowFocus: false,
        },
    },
});
