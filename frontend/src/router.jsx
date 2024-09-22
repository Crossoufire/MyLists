import {routeTree} from "@/routeTree.gen";
import {queryClient} from "@/api/queryClient";
import {createRouter} from "@tanstack/react-router";
import {ErrorComponent} from "@/components/app/base/ErrorComponent";


export const router = createRouter({
    routeTree,
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: ErrorComponent,
    context: { queryClient: queryClient, auth: undefined },
    defaultErrorComponent: ({ error }) =>
        <ErrorComponent
            statusCode={error.status}
            message={error.description}
        />,
});
