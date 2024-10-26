import NProgress from "nprogress";
import {routeTree} from "@/routeTree.gen";
import {queryClient} from "@/api/queryClient";
import {createRouter} from "@tanstack/react-router";
import {ErrorComponent} from "@/components/app/ErrorComponent";


declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }
}


// @ts-ignore
export const router = createRouter({
    routeTree,
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: ErrorComponent,
    context: {queryClient: queryClient, auth: undefined!},
    defaultErrorComponent: ({error}: { error: any }) =>
        <ErrorComponent
            statusCode={error.status}
            message={error.description}
        />,
});


NProgress.configure({showSpinner: false, parent: "body"});


router.subscribe("onBeforeLoad", (event) => {
    if (event.fromLocation.pathname === event.toLocation.pathname && event.fromLocation.hash !== event.toLocation.hash) return;
    NProgress.start();
});


router.subscribe("onResolved", (_event) => {
    NProgress.done();
});