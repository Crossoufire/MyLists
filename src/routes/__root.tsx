/// <reference types="vite/client"/>
import React from "react";
import appCSS from "@/styles.css?url";
import {Toaster} from "@/lib/components/ui/sonner";
import {Navbar} from "@/lib/components/navbar/Navbar";
import {Footer} from "@/lib/components/general/Footer";
import {useNProgress} from "@/lib/hooks/use-nprogress";
import type {QueryClient} from "@tanstack/react-query";
import {TanStackDevtools} from "@tanstack/react-devtools";
import {SheetProvider} from "@/lib/contexts/sheet-context";
import {ReactQueryDevtoolsPanel} from "@tanstack/react-query-devtools";
import {authOptions} from "@/lib/react-query/query-options/query-options";
import {TanStackRouterDevtoolsPanel} from "@tanstack/react-router-devtools";
import {createRootRouteWithContext, HeadContent, Outlet, Scripts, useLocation} from "@tanstack/react-router";


export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
    beforeLoad: async ({ context: { queryClient } }) => queryClient.prefetchQuery(authOptions),
    head: () => ({
        meta: [
            { charSet: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1" },
            { title: "MyLists" },
            {
                name: "description",
                content: "MyLists is your go-to platform for organizing your favorite series, anime, movies, games, and books. " +
                    "With a clean and user-friendly interface, it regroups the functionalities of multiple sites into one. " +
                    "MyLists integrates features such as total viewing time, comments, favorites, and more."
            },
        ],
        links: [{ rel: "stylesheet", href: appCSS }],
    }),
    component: RootComponent,
    shellComponent: RootComponent,
});


function RootComponent() {
    return (
        <RootDocument>
            <Outlet/>
        </RootDocument>
    );
}


function RootDocument({ children }: { readonly children: React.ReactNode }) {
    useNProgress();
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith("/admin");

    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            <HeadContent/>
        </head>
        <body>

        <div id="root">
            {isAdminRoute ?
                <AdminLayout>{children}</AdminLayout>
                :
                <MainLayout>{children}</MainLayout>
            }

            {import.meta.env.DEV &&
                <TanStackDevtools
                    eventBusConfig={{
                        debug: false,
                        connectToServerBus: true,
                    }}
                    plugins={[
                        {
                            name: "TanStack Query",
                            render: <ReactQueryDevtoolsPanel/>,
                        },
                        {
                            name: "TanStack Router",
                            render: <TanStackRouterDevtoolsPanel/>,
                        },
                    ]}
                />
            }
        </div>

        <Scripts/>
        </body>
        </html>
    );
}


const MainLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="flex flex-col min-h-[calc(100vh_-_64px)] mt-[64px]">
            <Toaster/>
            <SheetProvider>
                <Navbar/>
            </SheetProvider>
            <main className="flex-1 w-[100%] max-w-[1320px] px-2 mx-auto">
                {children}
            </main>
            <Footer/>
        </div>
    );
}


const AdminLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            <Toaster/>
            {children}
        </>
    );
}
