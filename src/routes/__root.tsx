/// <reference types="vite/client"/>
import React from "react";
import appCSS from "@/styles.css?url";
import {clientEnv} from "@/env/client";
import {PostHogProvider} from "posthog-js/react";
import {QueryClient} from "@tanstack/react-query";
import {addSeo, addSeoLinks} from "@/lib/utils/add-seo";
import {Toaster} from "@/lib/client/components/ui/sonner";
import {TanStackDevtools} from "@tanstack/react-devtools";
import {Navbar} from "@/lib/client/components/navbar/Navbar";
import {useNProgress} from "@/lib/client/hooks/use-nprogress";
import {Footer} from "@/lib/client/components/general/Footer";
import {ReactQueryDevtoolsPanel} from "@tanstack/react-query-devtools";
import {TanStackRouterDevtoolsPanel} from "@tanstack/react-router-devtools";
import {PostHogAuthSync} from "@/lib/client/components/general/PostHogAuthSync";
import {authOptions} from "@/lib/client/react-query/query-options/query-options";
import {FeatureVoteLink} from "@/lib/client/components/feature-votes/FeatureVoteLink";
import {createRootRouteWithContext, HeadContent, Outlet, Scripts} from "@tanstack/react-router";


export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
    ssr: false,
    beforeLoad: ({ context: { queryClient } }) => queryClient.fetchQuery(authOptions),
    head: () => ({
        links: [
            { rel: "stylesheet", href: appCSS },
            { rel: "icon", href: "/favicon.ico" },
            { rel: "manifest", href: "/manifest.json" },
            ...addSeoLinks({ canonical: "/" }),
        ],
        meta: [
            { charSet: "utf-8" },
            { name: "theme-color", content: "#020617" },
            { name: "viewport", content: "width=device-width, initial-scale=1" },
            ...addSeo({
                canonical: "/",
                image: "/logo512.png",
                title: "MyLists - Track movies, series, anime, games, books and manga",
                description: "MyLists is your all-in-one platform to organize your favorite series, movies, games, anime, books and manga.",
            }),
        ],
    }),
    component: RootComponent,
    shellComponent: RootComponent,
});


function RootComponent() {
    useNProgress();

    const children = (
        <>
            <PostHogAuthSync/>
            <Toaster/>
            <Navbar/>
            <Outlet/>
            <Footer/>
            <FeatureVoteLink/>
        </>
    );

    return (
        <html lang="en" className="dark" suppressHydrationWarning>
        <head>
            <HeadContent/>
        </head>
        <body>

        {import.meta.env.DEV ?
            <>
                {children}
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
            </>
            :
            <PostHogProvider
                apiKey={clientEnv.VITE_PUBLIC_POSTHOG_KEY}
                options={{
                    defaults: "2025-11-30",
                    capture_exceptions: true,
                    capture_pageview: "history_change",
                    person_profiles: "identified_only",
                    api_host: clientEnv.VITE_PUBLIC_POSTHOG_HOST,
                    ui_host: clientEnv.VITE_PUBLIC_POSTHOG_UI_HOST,
                }}
            >
                {children}
            </PostHogProvider>
        }

        <Scripts/>
        </body>
        </html>
    );
}
