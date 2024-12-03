import NProgress from "nprogress";
import {routeTree} from "@/routeTree.gen";
import {queryClient} from "@/libs/queryClient";
import {createRouter} from "@tanstack/react-router";
import {ErrorComponent} from "@/components/app/ErrorComponent";


// noinspection JSUnresolvedReference
NProgress.configure({ showSpinner: false, parent: "body" });


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


router.subscribe("onBeforeLoad", (event) => {
    if (event.fromLocation.pathname === event.toLocation.pathname && event.fromLocation.hash !== event.toLocation.hash) return;
    // noinspection JSUnresolvedReference
    NProgress.start();
});


router.subscribe("onResolved", (event) => {
    // noinspection JSUnresolvedReference
    NProgress.done();
});