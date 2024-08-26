import {useEffect, useState} from "react";
import {routeTree} from "./routeTree.gen";
import {createRoot} from "react-dom/client";
import {userClient} from "@/api/MyApiClient";
import {Loading} from "@/components/app/base/Loading";
import {ThemeProvider} from "@/providers/ThemeProvider";
import {ErrorComponent} from "@/components/app/base/ErrorComponent";
import {createRouter, RouterProvider} from "@tanstack/react-router";
import "./index.css";


const rootElement = document.getElementById("root");
if (!rootElement.innerHTML) {
    const root = createRoot(rootElement);
    root.render(<App/>);
}


function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <AuthWrapper>
                <RouterProvider router={router}/>
            </AuthWrapper>
        </ThemeProvider>
    );
}


function AuthWrapper({ children }) {
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        userClient.initialize().then(() => setIsInitialized(true));
    }, []);

    if (!isInitialized) {
        return <Loading/>;
    }

    return children;
}


const router = createRouter({
    defaultGcTime: 0,
    routeTree: routeTree,
    defaultPreload: false,
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