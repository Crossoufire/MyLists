import React, {Suspense} from "react";
import {Toaster} from "@/components/ui/sonner";
import {Footer} from "@/components/app/Footer";
import {Navbar} from "@/components/navbar/Navbar";
import {Loading} from "@/components/app/base/Loading";
import * as Nav from "@/components/ui/navigation-menu";
import {SheetProvider} from "@/providers/SheetProvider";
import {GlobalLoading} from "@/components/app/base/GlobalLoading";
import {createRootRoute, Outlet, ScrollRestoration} from "@tanstack/react-router";


// noinspection JSUnusedGlobalSymbols
export const Route = createRootRoute({
    component: () => (
        <Suspense fallback={<LoadingFallback/>}>
            <MainLayout/>
        </Suspense>
    ),
});


function LoadingFallback() {
    return (
        <>
            <nav className="z-50 fixed top-0 w-full h-16 border-b flex items-center bg-background border-b-neutral-700">
                <div className="md:max-w-screen-xl flex w-full justify-between items-center mx-auto container">
                    <Nav.NavigationMenu>
                        <Nav.NavigationMenuList>
                            <Nav.NavigationMenuItem>
                                <p className="text-lg font-semibold mr-2">MyLists</p>
                            </Nav.NavigationMenuItem>
                        </Nav.NavigationMenuList>
                    </Nav.NavigationMenu>
                </div>
            </nav>
            <Loading className="mt-10"/>
        </>
    );
}


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
            {import.meta.env.DEV && <TanStackRouterDevtools/>}
        </>
    );
}


const TanStackRouterDevtools = React.lazy(() =>
    import("@tanstack/router-devtools").then((res) => ({default: res.TanStackRouterDevtools}))
);
