import React from "react";
import ReactDOM from "react-dom/client";
import {routeTree} from "./routeTree.gen";
import {queryClient} from "@/utils/mutations";
import {ThemeProvider} from "@/providers/ThemeProvider";
import {QueryClientProvider} from "@tanstack/react-query";
import {ErrorComponent} from "@/components/app/base/ErrorComponent";
import {createRouter, RouterProvider} from "@tanstack/react-router";
import "./index.css";


const router = createRouter({
    routeTree,
    context: { queryClient: queryClient },
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: ErrorComponent,
    defaultErrorComponent: DefaultErrorComponent,
});


const rootElement = document.getElementById("root");
if (!rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <ThemeProvider>
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router}/>
            </QueryClientProvider>
        </ThemeProvider>
    );
}


export function DefaultErrorComponent({ error }) {
    try {
        return <ErrorComponent { ...JSON.parse(error.message) }/>;
    }
    catch {
        return <ErrorComponent/>;
    }
}
