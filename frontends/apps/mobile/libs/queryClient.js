import {ToastAndroid} from "react-native";
import {MutationCache, QueryCache, QueryClient} from "@tanstack/react-query";


export const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError: (error, query) => {
            if (query?.meta?.errorMessage) {
                ToastAndroid.show(query.meta.errorMessage, ToastAndroid.SHORT);
            }
        },
    }),
    mutationCache: new MutationCache({
        onError: (_error, _variables, _context, mutation) => {
            if (mutation?.meta?.errorMessage) {
                ToastAndroid.show(mutation.meta.errorMessage, ToastAndroid.SHORT);
            }
        },
        onSuccess: (_data, _variables, _context, mutation) => {
            if (mutation?.meta?.successMessage) {
                ToastAndroid.show(mutation.meta.successMessage, ToastAndroid.SHORT);
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
