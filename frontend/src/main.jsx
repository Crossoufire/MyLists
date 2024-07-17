import {routeTree} from "./routeTree.gen";
import {createRoot} from "react-dom/client";
import {ThemeProvider} from "@/providers/ThemeProvider";
import {ErrorComponent} from "@/components/app/base/ErrorComponent";
import {createRouter, RouterProvider} from "@tanstack/react-router";
import "./index.css";


const router = createRouter({
    defaultGcTime: 0,
    routeTree: routeTree,
    defaultPreload: false,
    defaultNotFoundComponent: ErrorComponent,
    defaultErrorComponent: DefaultErrorComponent,
});


const rootElement = document.getElementById("root");
if (!rootElement.innerHTML) {
    const root = createRoot(rootElement);
    root.render(<App/>);
}


function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <RouterProvider router={router}/>
        </ThemeProvider>
    )
}


function DefaultErrorComponent({ error }) {
    try {
        return <ErrorComponent {...JSON.parse(error.message)}/>;
    }
    catch {
        return <ErrorComponent/>;
    }
}