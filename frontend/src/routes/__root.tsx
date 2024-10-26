import React from "react";
import {UseAuthReturn} from "@/hooks/AuthHook";
import {Toaster} from "@/components/ui/sonner";
import {Footer} from "@/components/app/Footer";
import {Navbar} from "@/components/navbar/Navbar";
import {QueryClient} from "@tanstack/react-query";
import {SheetProvider} from "@/providers/SheetProvider";
import {createRootRouteWithContext, Outlet, ScrollRestoration} from "@tanstack/react-router";


export const Route = createRootRouteWithContext<{ queryClient: QueryClient, auth: UseAuthReturn }>()({
    component: RootComponent,
});


function RootComponent() {
    return (
        <>
            <Toaster/>
            <SheetProvider><Navbar/></SheetProvider>
            <main className="md:max-w-screen-xl container">
                <ScrollRestoration/>
                <Outlet/>
            </main>
            <Footer/>
            {import.meta.env.DEV && <ReactQueryDevtools/>}
            {import.meta.env.DEV && <TanStackRouterDevtools/>}
        </>
    );
}


const TanStackRouterDevtools = React.lazy(() =>
    import("@tanstack/router-devtools").then((res) => ({default: res.TanStackRouterDevtools}))
);

const ReactQueryDevtools = React.lazy(() =>
    import("@tanstack/react-query-devtools").then((res) => ({default: res.ReactQueryDevtools}))
);
