import ReactDOM from "react-dom/client";
import {useAuth} from "@/hooks/AuthHook";
import {routeTree} from "./routeTree.gen";
import {queryClient} from "@/api/queryClient";
import {ThemeProvider} from "@/providers/ThemeProvider";
import {QueryClientProvider} from "@tanstack/react-query";
import {ErrorComponent} from "@/components/app/base/ErrorComponent";
import {createRouter, RouterProvider} from "@tanstack/react-router";
import "./index.css";


const router = createRouter({
    routeTree,
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: ErrorComponent,
    context: { queryClient: queryClient, auth: undefined },
    defaultErrorComponent: ({ error }) =>
        <ErrorComponent
            statusCode={error.status}
            message={error.description}
        />,
});


export default function App() {
    return (
        <ThemeProvider>
            <QueryClientProvider client={queryClient}>
                <InnerApp/>
            </QueryClientProvider>
        </ThemeProvider>
    );
}


function InnerApp() {
    const auth = useAuth();
    // noinspection JSValidateTypes
    return <RouterProvider router={router} context={{ auth, queryClient }}/>;
}


const rootElement = document.getElementById("root");
if (!rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App/>);
}
