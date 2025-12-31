/// <reference types="vite/client"/>
import React from "react";
import appCSS from "@/styles.css?url";
import {addSeo} from "@/lib/utils/add-seo";
import {QueryClient} from "@tanstack/react-query";
import {Toaster} from "@/lib/client/components/ui/sonner";
import {TanStackDevtools} from "@tanstack/react-devtools";
import {Navbar} from "@/lib/client/components/navbar/Navbar";
import {useNProgress} from "@/lib/client/hooks/use-nprogress";
import {Footer} from "@/lib/client/components/general/Footer";
import {ReactQueryDevtoolsPanel} from "@tanstack/react-query-devtools";
import {TanStackRouterDevtoolsPanel} from "@tanstack/react-router-devtools";
import {authOptions} from "@/lib/client/react-query/query-options/query-options";
import {createRootRouteWithContext, HeadContent, Outlet, Scripts} from "@tanstack/react-router";


export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
    ssr: false,
    beforeLoad: ({ context: { queryClient } }) => queryClient.fetchQuery(authOptions),
    head: () => ({
        meta: [
            { charSet: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1" },
            ...addSeo({
                image: "logo512.png",
                title: "Mylists",
                description: "MyLists is your all-in-one platform to organize your favorite series, movies, games, anime, books and manga.",
            }),
        ],
        links: [{ rel: "stylesheet", href: appCSS }],
    }),
    component: RootComponent,
    shellComponent: RootComponent,
});


function RootComponent() {
    useNProgress();

    return (
        <html lang="en" suppressHydrationWarning className="dark">
        <head>
            <HeadContent/>
        </head>
        <body>

        <Toaster/>
        <Navbar/>
        <Outlet/>
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

        <Scripts/>
        </body>
        </html>
    );
}

