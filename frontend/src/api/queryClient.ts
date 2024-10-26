import {toast} from "sonner";
import {QueryCache, QueryClient} from "@tanstack/react-query";


export const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError: (error: unknown, query: { meta?: { errorMessage?: string } }) => {
            if (query?.meta?.errorMessage) {
                toast.error(query.meta.errorMessage);
            }
        },
    }),
    defaultOptions: {
        queries: {
            retry: false,
            staleTime: 2000,
            refetchOnWindowFocus: false,
        },
    },
});
