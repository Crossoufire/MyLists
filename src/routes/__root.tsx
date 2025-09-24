/// <reference types="vite/client"/>
import React from "react";
import appCSS from "@/styles.css?url";
import {QueryClient} from "@tanstack/react-query";
import {Toaster} from "@/lib/client/components/ui/sonner";
import {TanStackDevtools} from "@tanstack/react-devtools";
import {Navbar} from "@/lib/client/components/navbar/Navbar";
import {useNProgress} from "@/lib/client/hooks/use-nprogress";
import {Footer} from "@/lib/client/components/general/Footer";
import {SheetProvider} from "@/lib/client/contexts/sheet-context";
import {ReactQueryDevtoolsPanel} from "@tanstack/react-query-devtools";
import {TanStackRouterDevtoolsPanel} from "@tanstack/react-router-devtools";
import {authOptions} from "@/lib/client/react-query/query-options/query-options";
import {createRootRouteWithContext, HeadContent, Outlet, Scripts} from "@tanstack/react-router";


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
    ssr: false,
});


function RootComponent() {
    useNProgress();

    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            <HeadContent/>
        </head>
        <body>

        <div id="root">
            <div className="flex flex-col min-h-[calc(100vh_-_64px)] mt-[64px]">
                <Toaster/>
                <SheetProvider>
                    <Navbar/>
                </SheetProvider>
                <Outlet/>
                <Footer/>
            </div>

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
