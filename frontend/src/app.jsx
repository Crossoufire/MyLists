import {router} from "@/router";
import {initApiClient, useAuth} from "@/api";
import {queryClient} from "@/api/queryClient";
import {RouterProvider} from "@tanstack/react-router";
import {ThemeProvider} from "@/providers/ThemeProvider";
import {QueryClientProvider} from "@tanstack/react-query";


export default function App() {
    initApiClient(import.meta.env.VITE_BASE_API_URL);

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
    if (auth.isLoading) return null;
    return <RouterProvider router={router} context={{ auth, queryClient }}/>;
}
