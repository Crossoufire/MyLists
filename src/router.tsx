import {routeTree} from "./routeTree.gen";
import {QueryClient} from "@tanstack/react-query";
import {NotFound} from "@/lib/components/NotFound";
import {routerWithQueryClient} from "@tanstack/react-router-with-query";
import {DefaultCatchBoundary} from "@/lib/components/DefaultCatchBoundary";
import {createRouter as createTanStackRouter} from "@tanstack/react-router";


export function createRouter() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: false,
                staleTime: 1000 * 60,
            },
        },
    });

    return routerWithQueryClient(
        createTanStackRouter({
            routeTree,
            context: { queryClient, user: null },
            defaultPreload: false,
            defaultPreloadStaleTime: 0,
            defaultErrorComponent: DefaultCatchBoundary,
            defaultNotFoundComponent: NotFound,
            scrollRestoration: true,
            defaultStructuralSharing: true,
        }),
        queryClient,
    );
}


declare module "@tanstack/react-router" {
    interface Register {
        router: ReturnType<typeof createRouter>;
    }
}
