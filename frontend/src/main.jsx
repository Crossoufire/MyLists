import {routeTree} from "./routeTree.gen";
import {createRoot} from "react-dom/client";
import {Loading} from "@/components/app/base/Loading";
import {ThemeProvider} from "@/providers/ThemeProvider";
import {UserProvider, useUser} from "@/providers/UserProvider";
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


function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <UserProvider>
                <QueryClientProvider client={queryClient}>
                    <InnerApp/>
                </QueryClientProvider>
            </UserProvider>
        </ThemeProvider>
    );
}


const InnerApp = () => {
    const auth = useUser();
    if (auth.currentUser === undefined) return <Loading/>;
    return <RouterProvider router={router} context={{ auth }}/>
};


const router = createRouter({
    defaultGcTime: 0,
    routeTree: routeTree,
    defaultPreload: false,
    context: { auth: undefined },
    defaultNotFoundComponent: ErrorComponent,
    defaultErrorComponent: DefaultErrorComponent,
});


function DefaultErrorComponent({ error }) {
    try {
        return <ErrorComponent { ...JSON.parse(error.message) }/>;
    } catch {
        return <ErrorComponent/>;
    }
}