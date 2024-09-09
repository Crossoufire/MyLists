import {toast} from "sonner";
import {QueryCache, QueryClient} from "@tanstack/react-query";


export const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError: (error, query) => {
            // noinspection JSUnresolvedReference
            if (query.meta.errorMessage) {
                toast.error(query.meta.errorMessage);
            }
        },
    }),
    defaultOptions: {
        queries: {
            retry: false,
            staleTime: 0,
            refetchOnWindowFocus: false,
        },
    },
});
