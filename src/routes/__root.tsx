/// <reference types="vite/client"/>
import React from "react";
import appCSS from "@/styles.css?url";
import {Lightbulb} from "lucide-react";
import {addSeo} from "@/lib/utils/add-seo";
import {QueryClient} from "@tanstack/react-query";
import {Toaster} from "@/lib/client/components/ui/sonner";
import {TanStackDevtools} from "@tanstack/react-devtools";
import {Navbar} from "@/lib/client/components/navbar/Navbar";
import {useNProgress} from "@/lib/client/hooks/use-nprogress";
import {Footer} from "@/lib/client/components/general/Footer";
import {ReactQueryDevtoolsPanel} from "@tanstack/react-query-devtools";
import {TanStackRouterDevtoolsPanel} from "@tanstack/react-router-devtools";
import {PostHogAuthSync} from "@/lib/client/components/general/PostHogAuthSync";
import {authOptions} from "@/lib/client/react-query/query-options/query-options";
import {createRootRouteWithContext, HeadContent, Link, Outlet, Scripts} from "@tanstack/react-router";


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
        <html lang="en" className="dark" suppressHydrationWarning>
        <head>
            <HeadContent/>
        </head>
        <body>

        <PostHogAuthSync/>

        <Toaster/>
        <Navbar/>
        <Outlet/>
        <Footer/>

        <Link
            to="/features-vote"
            aria-label="Feature voting"
            className="group fixed bottom-5 right-5 z-50 flex h-10 w-10 items-center justify-center rounded-full border
            border-white/20 bg-black/20 backdrop-blur-xl transition-all duration-300 hover:border-amber-400
            hover:shadow-[0_0_20px_rgba(251,191,36,0.4)] active:scale-95 overflow-hidden"
        >
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-linear-to-r
            from-transparent via-white/30 to-transparent"/>
            <Lightbulb className="size-4 transition-transform duration-300 group-hover:scale-110 group-hover:text-amber-300"/>
            <span className="sr-only">Feature voting</span>
        </Link>

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

