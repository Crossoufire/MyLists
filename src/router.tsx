import {routeTree} from "./routeTree.gen";
import {NotFound} from "@/lib/components/app/NotFound";
import {queryClient} from "@/lib/react-query/query-client";
import {routerWithQueryClient} from "@tanstack/react-router-with-query";
import {createRouter as createTanStackRouter} from "@tanstack/react-router";
import {DefaultCatchBoundary} from "@/lib/components/app/DefaultCatchBoundary";


export function createRouter() {
    return routerWithQueryClient(
        createTanStackRouter({
            routeTree,
            context: { queryClient },
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
