import React from "react";
import {Toaster} from "@/components/ui/sonner";
import {Footer} from "@/components/app/Footer";
import {Navbar} from "@/components/navbar/Navbar";
import {UserProvider} from "@/providers/UserProvider";
import {SheetProvider} from "@/providers/SheetProvider";
import {RouterSpinner} from "@/components/app/base/RouterSpinner";
import {createRootRouteWithContext, Outlet, ScrollRestoration} from "@tanstack/react-router";


// noinspection JSUnusedGlobalSymbols
export const Route = createRootRouteWithContext()({
    component: RootComponent,
});


function RootComponent() {
    return (
        <UserProvider>
            <RouterSpinner/>
            <Toaster/>
            <SheetProvider><Navbar/></SheetProvider>
            <main className="md:max-w-screen-xl container">
                <ScrollRestoration/>
                <Outlet/>
            </main>
            <Footer/>
            {import.meta.env.DEV && <TanStackRouterDevtools/>}
            {import.meta.env.DEV && <ReactQueryDevtools/>}
        </UserProvider>
    );
}


const TanStackRouterDevtools = React.lazy(() =>
    import("@tanstack/router-devtools").then((res) => ({default: res.TanStackRouterDevtools}))
);

const ReactQueryDevtools = React.lazy(() =>
    import("@tanstack/react-query-devtools").then((res) => ({default: res.ReactQueryDevtools}))
);