import {Toaster} from "sonner";
import React, {lazy} from "react";
import appCss from "@/lib/styles/app.css?url";
import {getUser} from "@/lib/server/functions/user";
import type {QueryClient} from "@tanstack/react-query";
import {createRootRouteWithContext, HeadContent, Outlet, Scripts} from "@tanstack/react-router";


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
            { title: "MyLists" },
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

        <div id="root">
            <Toaster/>
            {/*<SheetProvider>*/}
            {/*    <Navbar/>*/}
            {/*</SheetProvider>*/}
            <main className="md:max-w-screen-xl container">
                {children}
            </main>
            {/*<Footer/>*/}
            {import.meta.env.DEV && <ReactQueryDevtools/>}
            {import.meta.env.DEV && <TanStackRouterDevtools/>}
        </div>

        <Scripts/>
        </body>
        </html>
    );
}


const TanStackRouterDevtools = lazy(() =>
    import("@tanstack/react-router-devtools").then((res) => ({ default: res.TanStackRouterDevtools }))
);

const ReactQueryDevtools = lazy(() =>
    import("@tanstack/react-query-devtools").then((res) => ({ default: res.ReactQueryDevtools }))
);