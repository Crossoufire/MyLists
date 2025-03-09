import {router} from "@/router";
import {initApiClient, useAuth} from "@/api";
import {queryClient} from "@/api/queryClient";
import {RouterProvider} from "@tanstack/react-router";
import {QueryClientProvider} from "@tanstack/react-query";


export default function App() {
    initApiClient(import.meta.env.VITE_BASE_API_URL);

    return (
        <QueryClientProvider client={queryClient}>
            <InnerApp/>
        </QueryClientProvider>
    );
}


function InnerApp() {
    const auth = useAuth();
    if (auth.isLoading) return null;
    return <RouterProvider router={router} context={{ auth, queryClient }}/>;
}
