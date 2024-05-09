import {routeTree} from "./routeTree.gen";
import {createRoot} from "react-dom/client";
import {ErrorPage} from "@/pages/ErrorPage";
import {ThemeProvider} from "@/providers/ThemeProvider";
import {createRouter, RouterProvider} from "@tanstack/react-router";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import "./index.css";


const queryClient = new QueryClient();


const router = createRouter({
    routeTree: routeTree,
    defaultPreload: false,
    defaultNotFoundComponent: ErrorPage,
    defaultErrorComponent: DefaultErrorComponent,
    defaultPreloadStaleTime: 10000,
});


const rootElement = document.getElementById("root");
if (!rootElement.innerHTML) {
    const root = createRoot(rootElement);
    root.render(<App/>);
}


export function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router}/>
            </QueryClientProvider>
        </ThemeProvider>
    )
}


function DefaultErrorComponent({ error }) {
    try {
        return <ErrorPage {...JSON.parse(error.message)}/>;
    }
    catch {
        return <ErrorPage/>;
    }
}