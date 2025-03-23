import React from "react";
import {auth} from "@/lib/server/auth/auth";
import appCss from "@/lib/styles/app.css?url";
import {createServerFn} from "@tanstack/react-start";
import type {QueryClient} from "@tanstack/react-query";
import {getWebRequest} from "@tanstack/react-start/server";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import {TanStackRouterDevtools} from "@tanstack/react-router-devtools";
import {createRootRouteWithContext, HeadContent, Outlet, Scripts} from "@tanstack/react-router";


const getUser = createServerFn({ method: "GET" }).handler(async () => {
    const { headers } = getWebRequest()!;
    const session = await auth.api.getSession({ headers });

    return session?.user || null;
});


export const Route = createRootRouteWithContext<{ queryClient: QueryClient; user: Awaited<ReturnType<typeof getUser>> }>()({
    beforeLoad: async ({ context }) => {
        const user = await context.queryClient.fetchQuery({
            queryKey: ["user"],
            queryFn: ({ signal }) => getUser({ signal }),
        });
        return { user };
    },
    head: () => ({
        meta: [
            { charSet: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1" },
            { title: "TanStarter" },
        ],
        links: [{ rel: "stylesheet", href: appCss }],
    }),
    component: RootComponent,
});


function RootComponent() {
    return (
        <RootDocument>
            <Outlet/>
        </RootDocument>
    );
}


function RootDocument({ children }: { readonly children: React.ReactNode }) {
    return (
        <html suppressHydrationWarning>
        <head>
            <HeadContent/>
        </head>
        <body>

        {children}

        <ReactQueryDevtools buttonPosition="bottom-left"/>
        <TanStackRouterDevtools position="bottom-right"/>

        <Scripts/>
        </body>
        </html>
    );
}
