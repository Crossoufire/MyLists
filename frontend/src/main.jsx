import {routeTree} from "./routeTree.gen";
import {createRoot} from "react-dom/client";
import {ThemeProvider} from "@/providers/ThemeProvider";
import {ErrorComponent} from "@/components/app/base/ErrorComponent";
import {createRouter, RouterProvider} from "@tanstack/react-router";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import "./index.css";


const queryClient = new QueryClient();


const rootElement = document.getElementById("root");
if (!rootElement.innerHTML) {
    const root = createRoot(rootElement);
    root.render(<App/>);
}


export default function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router}/>
            </QueryClientProvider>
        </ThemeProvider>
    );
}


const router = createRouter({
    defaultGcTime: 0,
    routeTree: routeTree,
    defaultNotFoundComponent: ErrorComponent,
    defaultErrorComponent: DefaultErrorComponent,
    defaultStaleTime: 0,
});


function DefaultErrorComponent({ error }) {
    try {
        return <ErrorComponent { ...JSON.parse(error.message) }/>;
    } catch {
        return <ErrorComponent/>;
    }
}
