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
import {createRootRouteWithContext, HeadContent, Outlet, Scripts} from "@tanstack/react-router";


export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
    beforeLoad: async ({ context: { queryClient } }) => {
        return queryClient.fetchQuery(authOptions());
    },
    head: () => ({
        meta: [
            { charSet: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1" },
            { title: "MyLists" },
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

    return (
        <html suppressHydrationWarning>
        <head>
            <HeadContent/>
        </head>
        <body>

        <div id="root" className="flex flex-col min-h-[calc(100vh_-_64px)] mt-[64px]">
            <Toaster/>
            <SheetProvider>
                <Navbar/>
            </SheetProvider>
            <main className="md:max-w-screen-xl container mx-auto flex-1">
                {children}
            </main>
            <Footer/>

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
