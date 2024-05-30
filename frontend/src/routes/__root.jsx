import React from "react";
import {Toaster} from "@/components/ui/sonner";
import {Footer} from "@/components/app/Footer";
import {Navbar} from "@/components/navbar/Navbar";
import {SheetProvider} from "@/providers/SheetProvider";
import {GlobalLoading} from "@/components/app/GlobalLoading";
import {createRootRoute, Outlet, ScrollRestoration} from "@tanstack/react-router";


// noinspection JSUnusedGlobalSymbols
export const Route = createRootRoute({
    component: MainLayout,
});


function MainLayout() {
    return (
        <>
            <GlobalLoading/>
            <Toaster/>
            <SheetProvider><Navbar/></SheetProvider>
            <main className="md:max-w-screen-xl container">
                <ScrollRestoration/>
                <Outlet/>
            </main>
            <Footer/>
            <TanStackRouterDevtools/>
        </>
    );
}


const TanStackRouterDevtools = !import.meta.env.DEV ? () => null :
    React.lazy(() => import("@tanstack/router-devtools")
        .then((res) => ({ default: res.TanStackRouterDevtools }))
    );
