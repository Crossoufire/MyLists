import {toast} from "sonner";
import {routeTree} from "@/routeTree.gen";
import {createRouter} from "@tanstack/react-router";
import {NotFound} from "@/lib/client/components/general/NotFound";
import {DefaultLoader} from "@/lib/client/components/general/DefaultLoader";
import {MutationCache, QueryCache, QueryClient} from "@tanstack/react-query";
import {ErrorCatchBoundary} from "@/lib/client/components/general/ErrorCatchBoundary";
import {setupRouterSsrQueryIntegration} from "@tanstack/react-router-ssr-query";


export function getRouter() {
    const queryClient = new QueryClient({
        queryCache: new QueryCache({
            onError: (error, query) => {
                if (query?.meta?.displayErrorMsg) {
                    toast.error(error.message);
                }
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

    const router = createRouter({
        routeTree,
        context: { queryClient },
        defaultPreload: false,
        defaultPreloadStaleTime: 0,
        defaultErrorComponent: ErrorCatchBoundary,
        defaultNotFoundComponent: NotFound,
        defaultPendingComponent: DefaultLoader,
        defaultPendingMs: 1000,
        defaultPendingMinMs: 500,
        scrollRestoration: true,
        defaultStructuralSharing: true,
    });

    setupRouterSsrQueryIntegration({
        router,
        queryClient,
        handleRedirects: true,
        wrapQueryClient: true,
    });

    return router;
}
