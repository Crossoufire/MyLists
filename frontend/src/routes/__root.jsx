import {Toaster} from "@/components/ui/sonner";
import {Footer} from "@/components/app/Footer";
import {Navbar} from "@/components/navbar/Navbar";
import {SheetProvider} from "@/providers/SheetProvider";
import {GlobalLoading} from "@/components/app/GlobalLoading";
import {TanStackRouterDevtools} from "@tanstack/router-devtools";
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
